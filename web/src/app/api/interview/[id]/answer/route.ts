import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';
import { evaluateAnswer } from '@/lib/agents/interview';
import type { Interview, InterviewEvaluation } from '@/types';

function answerResult(interview: Interview, evaluation: InterviewEvaluation) {
  return NextResponse.json({
    success: true,
    data: { evaluation, interview, is_complete: interview.status === 'completed' },
  });
}

function staleRound() {
  return NextResponse.json(
    { success: false, error: { code: 'stale_round', message: 'This interview has moved on. Reopen it to see the latest round.' } },
    { status: 409 }
  );
}

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
    const body = await request.json().catch(() => null);
    const answer: unknown = body?.answer;
    const questionIndex: unknown = body?.question_index;
    if (typeof answer !== 'string' || !answer.trim() || answer.length > 20000
      || typeof questionIndex !== 'number' || !Number.isInteger(questionIndex) || questionIndex < 0) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_answer', message: 'Send a valid round index and an answer of up to 20,000 characters.' } },
        { status: 400 }
      );
    }

    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .eq('profile_id', user.id)
      .maybeSingle<Interview>();
    if (fetchError) throw fetchError;
    if (!interview) {
      return NextResponse.json(
        { success: false, error: { code: 'not_found', message: 'Interview not found' } },
        { status: 404 }
      );
    }

    const answers = interview.answers ?? [];
    const evaluations = interview.evaluations ?? [];
    const question = interview.questions?.[questionIndex];
    if (!question) {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_index', message: 'This round does not exist.' } },
        { status: 400 }
      );
    }

    // A retry of an already committed answer can reuse its saved evaluation.
    if (answers[questionIndex] === answer && evaluations[questionIndex]) {
      return answerResult(interview, evaluations[questionIndex]);
    }
    if ((interview.status !== 'in_progress' && interview.status !== 'pending') || questionIndex !== answers.length) {
      return staleRound();
    }

    const quota = await enforceAIQuota(supabase, 'interview-answer');
    if (quota) return quota;

    const evaluation = await evaluateAnswer({
      question: question.question,
      answer,
      expected_topics: question.expected_topics ?? [],
    });
    evaluation.question_id = question.id;

    const nextAnswers = [...answers, answer];
    const nextEvaluations = [...evaluations, evaluation];
    const isComplete = nextAnswers.length === interview.questions.length;
    const overallScore = isComplete
      ? Math.round(nextEvaluations.reduce((sum, item) => sum + (item.score || 0), 0) / nextEvaluations.length * 10)
      : null;

    // The slot must still be empty when Postgres updates the row. A competing
    // submission that already filled it will leave this update with zero rows.
    const { data: updated, error: updateError } = await supabase
      .from('interviews')
      .update({
        answers: nextAnswers,
        evaluations: nextEvaluations,
        status: isComplete ? 'completed' : 'in_progress',
        overall_score: overallScore,
        feedback_summary: isComplete
          ? `Scored ${overallScore}/100. Covered ${nextEvaluations.filter(item => item.score >= 6).length}/${nextEvaluations.length} questions well.`
          : null,
      })
      .eq('id', id)
      .eq('profile_id', user.id)
      .eq('status', interview.status)
      .is(`answers->${questionIndex}`, null)
      .select()
      .maybeSingle<Interview>();
    if (updateError) throw updateError;

    return updated ? answerResult(updated, evaluation) : staleRound();
  } catch (err) {
    console.error('Answer evaluation error:', err instanceof Error ? err.name : 'database_error');
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Failed to evaluate answer' } },
      { status: 500 }
    );
  }
}
