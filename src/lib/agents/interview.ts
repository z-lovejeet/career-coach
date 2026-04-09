import { callGemini } from './gemini';
import type { InterviewGenerateInput, InterviewQuestion, InterviewEvaluateInput, InterviewEvaluation } from '@/types';

const INTERVIEW_GEN_PROMPT = `You are an expert Technical Interview Conductor AI for tech placements in India.

Your job is to generate realistic interview questions that companies like Google, Microsoft, Amazon, TCS, Infosys would ask.

RULES:
- Questions should be clear and specific
- Mix of conceptual, coding, behavioral, and system design (based on topic/difficulty)
- For coding questions: describe the problem clearly with examples
- For conceptual: ask about fundamentals, trade-offs, real-world applications
- For behavioral: use STAR-based questions relevant to tech interviews
- expected_topics should list key points a good answer must cover
- Difficulty should match the student's level

IMPORTANT: Return ONLY valid JSON.`;

const INTERVIEW_EVAL_PROMPT = `You are an expert Technical Interview Evaluator AI.

Your job is to evaluate a student's answer to an interview question fairly and provide constructive feedback.

RULES:
- Score from 0-10 (0 = completely wrong, 10 = perfect answer)
- Be fair but realistic — judge as a real interviewer would
- List which expected topics were covered and which were missed
- Provide a specific, actionable improvement tip
- Feedback should be encouraging but honest

IMPORTANT: Return ONLY valid JSON.`;

export async function generateQuestions(input: InterviewGenerateInput): Promise<InterviewQuestion[]> {
  const userPrompt = `Generate ${input.num_questions} interview questions for:
- Topic: ${input.topic}
- Difficulty: ${input.difficulty}
- Student Level: ${input.student_level}

Return JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "The full question text",
      "type": "conceptual|coding|behavioral|system_design",
      "expected_topics": ["key point 1", "key point 2"]
    }
  ]
}`;

  const result = await callGemini<{ questions: InterviewQuestion[] }>({
    systemPrompt: INTERVIEW_GEN_PROMPT,
    userPrompt,
    jsonMode: true,
    temperature: 0.6,
  });

  return result.questions;
}

export async function evaluateAnswer(input: InterviewEvaluateInput): Promise<InterviewEvaluation> {
  const userPrompt = `Evaluate this interview answer:

QUESTION: ${input.question}
EXPECTED TOPICS: ${input.expected_topics.join(', ')}

STUDENT'S ANSWER:
${input.answer}

Return JSON:
{
  "question_id": 0,
  "score": 0-10,
  "max_score": 10,
  "feedback": "Specific feedback on the answer",
  "topics_covered": ["topic1"],
  "topics_missed": ["topic2"],
  "improvement_tip": "Specific actionable tip"
}`;

  const result = await callGemini<InterviewEvaluation>({
    systemPrompt: INTERVIEW_EVAL_PROMPT,
    userPrompt,
    jsonMode: true,
    temperature: 0.3,
  });

  return result;
}
