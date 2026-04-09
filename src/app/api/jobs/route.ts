import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@/lib/supabase/server';

const ACTOR_ID = 'cheap_scraper/linkedin-job-scraper';

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

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { success: false, error: { code: 'config_error', message: 'Apify API token not configured' } },
        { status: 500 }
      );
    }

    // Get search params from request body or auto-generate from profile
    const body = await request.json().catch(() => ({}));

    // Fetch profile for auto-generating search params
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, preferred_role, preferred_locations, experience_level')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'no_profile', message: 'Complete your profile first' } },
        { status: 400 }
      );
    }

    // Build search input for cheap_scraper/linkedin-job-scraper
    const keywords = body.keywords || profile.preferred_role || profile.skills?.slice(0, 3).join(' ') || 'software engineer';
    const location = body.location || profile.preferred_locations?.[0] || 'India';
    const experienceLevel = getExperienceFilter(profile.experience_level);

    const actorInput: Record<string, unknown> = {
      keyword: Array.isArray(keywords) ? keywords : [keywords],
      location,
      publishedAt: 'r604800', // Past 7 days
      experienceLevel: experienceLevel,
      jobType: ['full-time'],
      maxItems: 15,
      saveOnlyUniqueItems: true,
      enrichCompanyData: false, // Faster without company enrichment
    };

    // If user provided a direct URL, use that instead
    if (body.searchUrl) {
      actorInput.startUrls = [{ url: body.searchUrl }];
    }

    // Initialize Apify client and run the actor
    const client = new ApifyClient({ token: apiToken });

    const run = await client.actor(ACTOR_ID).call(actorInput, {
      timeout: 120,
      memory: 256,
    });

    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Transform cheap_scraper output to our frontend format
    const jobs = items.map((item: Record<string, unknown>) => ({
      id: item.jobId as string || String(Math.random()),
      title: item.jobTitle as string || 'Untitled',
      companyName: item.companyName as string || 'Unknown',
      companyLogo: item.companyLogo as string || null,
      companyUrl: item.companyUrl as string || null,
      companyWebsite: (item.companyWebsite as string) || null,
      companyDescription: typeof item.companyDescription === 'string'
        ? item.companyDescription.substring(0, 200)
        : null,
      companyEmployeesCount: item.companyEmployeeCount as number || null,
      location: item.location as string || '',
      salaryInfo: item.salaryInfo as string[] || [],
      postedAt: item.postedTime as string || item.publishedAt as string || '',
      benefits: [],
      applyUrl: item.applyUrl as string || item.jobUrl as string || '',
      link: item.jobUrl as string || '',
      description: typeof item.jobDescription === 'string'
        ? (item.jobDescription as string).substring(0, 500)
        : '',
      seniorityLevel: item.experienceLevel as string || null,
      employmentType: item.contractType as string || null,
      jobFunction: item.workType as string || null,
      industries: item.sector as string || null,
      applicantsCount: item.applicationsCount as string || null,
      applyType: item.applyType as string || null,
      recruiter: item.posterFullName ? {
        name: item.posterFullName as string,
        title: '',
        photo: null,
        profileUrl: item.posterProfileUrl as string || null,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        total: jobs.length,
        source: 'linkedin',
        scrapedAt: new Date().toISOString(),
      }
    });
  } catch (err) {
    console.error('LinkedIn scraping failed, falling back to AI suggestions:', err);

    // === FALLBACK: Use Gemini to generate job suggestions ===
    try {
      const supabaseFallback = await createClient();
      const { data: { user: fallbackUser } } = await supabaseFallback.auth.getUser();

      if (!fallbackUser) {
        return NextResponse.json(
          { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
          { status: 401 }
        );
      }

      const { data: profile } = await supabaseFallback
        .from('profiles')
        .select('skills, preferred_role, experience_level, goals')
        .eq('id', fallbackUser.id)
        .single();

      const skills = profile?.skills?.join(', ') || 'software development';
      const role = profile?.preferred_role || 'Software Engineer';
      const level = profile?.experience_level || 'fresher';

      const { callGemini } = await import('@/lib/agents/gemini');
      const result = await callGemini<{ jobs: Array<{
        id: string; title: string; companyName: string; location: string;
        employmentType: string; salaryInfo: string[]; description: string;
        applyUrl: string; postedAt: string; seniorityLevel: string;
      }> }>({
        systemPrompt: 'You are a job market expert for the Indian tech industry. Generate realistic job listings from REAL companies hiring in India.',
        userPrompt: `Generate 10 realistic job listings for a ${level} with skills: ${skills}, targeting ${role} roles. Goals: ${(profile?.goals || []).join(', ')}.

Return JSON: { "jobs": [{ "id": "1", "title": "...", "companyName": "Real Indian company", "location": "City, India", "employmentType": "Full-time", "salaryInfo": ["₹X-Y LPA"], "description": "2-3 sentences", "applyUrl": "https://careers.company.com", "postedAt": "2 days ago", "seniorityLevel": "Entry level" }] }

Use REAL companies: TCS, Infosys, Google India, Microsoft, Amazon, Flipkart, Razorpay, CRED, PhonePe, Swiggy, etc.`,
        jsonMode: true,
        temperature: 0.8,
      });

      return NextResponse.json({
        success: true,
        data: {
          jobs: (result.jobs || []).map(j => ({ ...j, link: j.applyUrl, companyLogo: null, companyUrl: null, companyWebsite: null, companyDescription: null, companyEmployeesCount: null, benefits: [], recruiter: null, jobFunction: null, industries: null, applicantsCount: null })),
          total: result.jobs?.length || 0,
          source: 'ai',
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (fallbackErr) {
      console.error('AI fallback also failed:', fallbackErr);
      return NextResponse.json(
        { success: false, error: { code: 'scrape_error', message: 'Job search temporarily unavailable. Please try again.' } },
        { status: 500 }
      );
    }
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
