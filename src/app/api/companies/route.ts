import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recommendCompanies } from '@/lib/agents/recommendation';
import type { RecommendationInput } from '@/types';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Fetch latest analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { success: false, error: { code: 'no_analysis', message: 'Run profile analysis first' } },
        { status: 400 }
      );
    }

    // Fetch profile for goals and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('goals, preferred_locations, experience_level')
      .eq('id', user.id)
      .single();

    // Build recommendation input
    const input: RecommendationInput = {
      analysis: {
        extracted_skills: analysis.extracted_skills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missing_skills: analysis.missing_skills,
        readiness_score: analysis.readiness_score,
        summary: analysis.summary,
      },
      goals: profile?.goals || [],
      preferred_locations: profile?.preferred_locations || [],
      experience_level: profile?.experience_level || 'fresher',
    };

    // Run recommendation agent
    const recommendations = await recommendCompanies(input);

    // Store recommendations
    const { data: savedRecs, error: saveError } = await supabase
      .from('company_recommendations')
      .insert({
        profile_id: user.id,
        analysis_id: analysis.id,
        current_fit_companies: recommendations.current_fit_companies,
        target_companies: recommendations.target_companies,
        skill_gaps: recommendations.skill_gaps,
        roadmap_to_target: recommendations.roadmap_to_target,
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { success: false, error: { code: 'save_failed', message: saveError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: savedRecs });
  } catch (err) {
    console.error('Recommendation error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'AI recommendation failed. Please try again.' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data: recommendations, error } = await supabase
      .from('company_recommendations')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'No recommendations found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: recommendations });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
