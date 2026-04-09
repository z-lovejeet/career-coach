import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateAnswer } from '@/lib/agents/interview';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { answer, question_index } = await request.json();

    // Fetch interview
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Interview not found' } },
        { status: 404 }
      );
    }

    const questions = interview.questions as Array<{ id: number; question: string; expected_topics: string[] }>;
    const question = questions[question_index];

    if (!question) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_index', message: 'Invalid question index' } },
        { status: 400 }
      );
    }

    // Evaluate the answer
    const evaluation = await evaluateAnswer({
      question: question.question,
      answer,
      expected_topics: question.expected_topics,
    });
    evaluation.question_id = question.id;

    // Update interview with answer and evaluation
    const answers = [...(interview.answers as string[]), answer];
    const evaluations = [...(interview.evaluations as object[]), evaluation];

    const isComplete = answers.length >= questions.length;
    const overallScore = isComplete
      ? Math.round(
          evaluations.reduce((sum: number, e: any) => sum + (e.score || 0), 0) /
          evaluations.length * 10
        )
      : null;

    const { data: updated, error: updateError } = await supabase
      .from('interviews')
      .update({
        answers,
        evaluations,
        status: isComplete ? 'completed' : 'in_progress',
        overall_score: overallScore,
        feedback_summary: isComplete
          ? `Scored ${overallScore}/100. Covered ${evaluations.filter((e: any) => e.score >= 6).length}/${evaluations.length} questions well.`
          : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'update_failed', message: updateError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluation,
        interview: updated,
        is_complete: isComplete,
      },
    });
  } catch (err) {
    console.error('Answer evaluation error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Failed to evaluate answer' } },
      { status: 500 }
    );
  }
}
