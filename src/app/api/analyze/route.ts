import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeProfile } from '@/lib/agents/analyzer';
import type { AnalyzerInput } from '@/types';

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

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: { code: 'no_profile', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    // Build analyzer input
    const input: AnalyzerInput = {
      skills: profile.skills || [],
      skill_ratings: profile.skill_ratings || {},
      projects: profile.projects || [],
      education: `${profile.education_level || ''} ${profile.field_of_study || ''}`.trim(),
      experience: profile.experience_level || 'fresher',
      goals: profile.goals || [],
      resume_text: profile.resume_text || undefined,
    };

    // Run analyzer agent
    const analysis = await analyzeProfile(input);

    // Store analysis in database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        profile_id: user.id,
        extracted_skills: analysis.extracted_skills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missing_skills: analysis.missing_skills,
        readiness_score: analysis.readiness_score,
        summary: analysis.summary,
        raw_response: analysis,
      })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { success: false, error: { code: 'save_failed', message: saveError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: savedAnalysis });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'AI analysis failed. Please try again.' } },
      { status: 500 }
    );
  }
}
