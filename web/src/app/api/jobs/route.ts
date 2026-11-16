import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';

const JOB_LIMIT = 15;
const ACTOR_TIMEOUT = 15;
const ACTOR_URL = 'https://api.apify.com/v2/actors/cheap_scraper~linkedin-job-scraper/run-sync-get-dataset-items';

function getWebUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
      ? url.href : '';
  } catch {
    return '';
  }
}

function getLinkedInSearch(keywords: string[], location: string, searchUrl: unknown) {
  if (searchUrl !== undefined) {
    const safeUrl = getWebUrl(searchUrl);
    if (!safeUrl) return null;
    const url = new URL(safeUrl);
    if (url.protocol !== 'https:' || url.port
      || (url.hostname !== 'linkedin.com' && !url.hostname.endsWith('.linkedin.com'))
      || !url.pathname.startsWith('/jobs/')) return null;
    return url;
  }
  const url = new URL('https://www.linkedin.com/jobs/search/');
  url.searchParams.set('keywords', keywords.join(' '));
  url.searchParams.set('location', location);
  return url;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('skills, preferred_role, preferred_locations, experience_level')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const keywordInput: unknown[] = Array.isArray(body?.keywords) ? body.keywords : [body?.keywords];
    const requestedKeywords = keywordInput
      .slice(0, 5).map(value => text(value).trim().slice(0, 120)).filter(Boolean);
    const keywords = requestedKeywords.length > 0 ? requestedKeywords : [
      profile?.preferred_role || profile?.skills?.slice(0, 3).join(' ') || 'software engineer',
    ];
    const location = text(body?.location).trim().slice(0, 120) || profile?.preferred_locations?.[0] || 'India';
    const searchUrl = getLinkedInSearch(keywords, location, body?.searchUrl);
    if (!searchUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_search', message: 'Enter a valid LinkedIn jobs URL.' } },
        { status: 400 }
      );
    }

    const fallback = () => NextResponse.json({
      success: true,
      data: { jobs: [], total: 0, source: 'search', searchUrl: searchUrl.href },
    });
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) return fallback();
    const quota = await enforceAIQuota(supabase, 'jobs');
    if (quota) return quota;

    const actorInput = {
      keyword: keywords,
      location,
      publishedAt: 'r604800',
      experienceLevel: getExperienceFilter(profile?.experience_level),
      jobType: ['full-time'],
      maxItems: JOB_LIMIT,
      saveOnlyUniqueItems: true,
      enrichCompanyData: false,
      ...(body?.searchUrl ? { startUrls: [{ url: searchUrl.href }] } : {}),
    };

    try {
      const actorUrl = new URL(ACTOR_URL);
      actorUrl.search = new URLSearchParams({
        timeout: String(ACTOR_TIMEOUT),
        memory: '256',
        maxItems: String(JOB_LIMIT),
        limit: String(JOB_LIMIT),
        format: 'json',
      }).toString();
      const result = await fetch(actorUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(actorInput),
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout((ACTOR_TIMEOUT + 3) * 1000),
      });
      if (!result.ok) throw new Error(`Apify returned status ${result.status}`);
      const items: unknown = await result.json();
      if (!Array.isArray(items)) throw new Error('Apify returned an invalid dataset');

      const records = items.slice(0, JOB_LIMIT).filter((item): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && !Array.isArray(item));
      const jobs = records.map(item => ({
        id: text(item.jobId) || crypto.randomUUID(),
        title: text(item.jobTitle) || 'Untitled role',
        companyName: text(item.companyName) || 'Unknown company',
        companyLogo: getWebUrl(item.companyLogo) || null,
        companyUrl: getWebUrl(item.companyUrl) || null,
        companyWebsite: getWebUrl(item.companyWebsite) || null,
        companyDescription: text(item.companyDescription).slice(0, 200) || null,
        companyEmployeesCount: typeof item.companyEmployeeCount === 'number' ? item.companyEmployeeCount : null,
        location: text(item.location),
        salaryInfo: Array.isArray(item.salaryInfo) ? item.salaryInfo.filter((value): value is string => typeof value === 'string') : [],
        postedAt: text(item.postedTime) || text(item.publishedAt),
        benefits: [],
        applyUrl: getWebUrl(item.applyUrl) || getWebUrl(item.jobUrl),
        link: getWebUrl(item.jobUrl),
        description: text(item.jobDescription).slice(0, 500),
        seniorityLevel: text(item.experienceLevel) || null,
        employmentType: text(item.contractType) || null,
        jobFunction: text(item.workType) || null,
        industries: text(item.sector) || null,
        applicantsCount: text(item.applicationsCount) || null,
        applyType: text(item.applyType) || null,
        recruiter: item.posterFullName ? {
          name: text(item.posterFullName),
          title: '',
          photo: null,
          profileUrl: getWebUrl(item.posterProfileUrl) || null,
        } : null,
      }));

      return NextResponse.json({
        success: true,
        data: { jobs, total: jobs.length, source: 'linkedin', scrapedAt: new Date().toISOString(), searchUrl: searchUrl.href },
      });
    } catch (err) {
      console.warn('LinkedIn search failed:', err instanceof Error ? err.name : 'unknown_error');
      return fallback();
    }
  } catch (err) {
    console.error('Job search failed:', err instanceof Error ? err.name : 'database_error');
    return NextResponse.json(
      { success: false, error: { code: 'search_error', message: 'Job search is unavailable. Please try again.' } },
      { status: 500 }
    );
  }
}

function getExperienceFilter(level?: string): string[] {
  switch (level) {
    case 'fresher': return ['internship', 'entry-level'];
    case 'intern': return ['internship'];
    case '0-1': return ['entry-level'];
    case '1-3': return ['associate', 'mid-senior'];
    case '3+': return ['mid-senior', 'director'];
    default: return ['internship', 'entry-level'];
  }
}
