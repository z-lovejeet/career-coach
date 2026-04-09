import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@/lib/supabase/server';

const ACTOR_ID = 'curious_coder~linkedin-jobs-scraper';

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
    let searchUrl = body.searchUrl as string | undefined;

    if (!searchUrl) {
      // Auto-generate search URL from profile skills and goals
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

      // Build LinkedIn search URL from profile data
      const keywords = profile.preferred_role || profile.skills?.slice(0, 3).join(' ') || 'software engineer';
      const location = profile.preferred_locations?.[0] || 'India';
      
      // LinkedIn public jobs search URL format
      const params = new URLSearchParams({
        keywords: keywords,
        location: location,
        f_TPR: 'r604800', // Past week
        f_E: getExperienceFilter(profile.experience_level),
      });
      
      searchUrl = `https://www.linkedin.com/jobs/search/?${params.toString()}`;
    }

    // Initialize Apify client
    const client = new ApifyClient({ token: apiToken });

    // Run the LinkedIn jobs scraper actor
    const run = await client.actor(ACTOR_ID).call({
      startUrls: [{ url: searchUrl }],
      maxItems: 15,
      scrapeCompany: true,
    }, {
      timeout: 120, // 2 minute timeout
      memory: 256,
    });

    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Transform Apify output to our format
    const jobs = items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: item.title as string,
      companyName: item.companyName as string,
      companyLogo: item.companyLogo as string || null,
      companyUrl: item.companyLinkedinUrl as string || null,
      companyWebsite: item.companyWebsite as string || null,
      companyDescription: typeof item.companyDescription === 'string' 
        ? item.companyDescription.substring(0, 200) 
        : null,
      companyEmployeesCount: item.companyEmployeesCount as number || null,
      location: item.location as string,
      salaryInfo: item.salaryInfo as string[] || [],
      postedAt: item.postedAt as string,
      benefits: item.benefits as string[] || [],
      applyUrl: item.applyUrl as string || item.link as string,
      link: item.link as string,
      description: typeof item.descriptionText === 'string'
        ? (item.descriptionText as string).substring(0, 500)
        : '',
      seniorityLevel: item.seniorityLevel as string || null,
      employmentType: item.employmentType as string || null,
      jobFunction: item.jobFunction as string || null,
      industries: item.industries as string || null,
      applicantsCount: item.applicantsCount as string || null,
      recruiter: item.jobPosterName ? {
        name: item.jobPosterName as string,
        title: item.jobPosterTitle as string || '',
        photo: item.jobPosterPhoto as string || null,
        profileUrl: item.jobPosterProfileUrl as string || null,
      } : null,
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        jobs,
        searchUrl,
        total: jobs.length,
        scrapedAt: new Date().toISOString(),
      }
    });
  } catch (err) {
    console.error('LinkedIn jobs scraping error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch LinkedIn jobs';
    return NextResponse.json(
      { success: false, error: { code: 'scrape_error', message } },
      { status: 500 }
    );
  }
}

function getExperienceFilter(level?: string): string {
  switch (level) {
    case 'fresher': return '1'; // Internship
    case 'intern': return '1'; // Internship
    case '0-1': return '2'; // Entry level
    case '1-3': return '3'; // Associate
    case '3+': return '4'; // Mid-Senior
    default: return '1,2'; // Internship + Entry
  }
}
