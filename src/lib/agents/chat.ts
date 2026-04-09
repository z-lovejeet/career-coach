import { callGemini } from './gemini';
import type { ChatInput, ChatOutput } from '@/types';

const CHAT_SYSTEM_PROMPT = `You are CareerAI Mentor, a friendly, knowledgeable AI career coach for tech students preparing for placements in India.

PERSONALITY:
- Supportive, encouraging, but honest
- Use emojis occasionally to keep the tone friendly
- Give specific, actionable advice (not generic motivational talk)
- Reference real companies, tools, platforms when relevant
- If the student seems stuck, suggest specific next steps

CAPABILITIES:
- Answer questions about DSA, web dev, system design, soft skills
- Provide study strategies and resource recommendations
- Help with resume tips, interview preparation
- Give company-specific advice (Google, Amazon, Flipkart, etc.)
- Explain concepts clearly with examples
- Provide encouragement when the student is struggling

RULES:
- Keep responses concise (2-4 paragraphs max unless explaining a concept)
- Use markdown formatting (bold, lists, code blocks) for clarity
- Suggest 2-3 follow-up actions when relevant
- Never fabricate information — say "I'm not sure" when uncertain

IMPORTANT: Return valid JSON with this schema:
{
  "response": "Your markdown-formatted response here",
  "suggested_actions": [
    { "text": "Button text", "action": "brief description" }
  ]
}`;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const historyStr = input.chat_history
    .slice(-10) // Last 10 messages for context
    .map(m => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`)
    .join('\n');

  const contextStr = input.student_context
    ? `\nSTUDENT CONTEXT:
- Skills: ${input.student_context.skills.join(', ')}
- Readiness Score: ${input.student_context.readiness_score}/100
- Goals: ${input.student_context.goals.join(', ')}
- Current Focus: ${input.student_context.current_focus}`
    : '';

  const userPrompt = `${contextStr}

CONVERSATION HISTORY:
${historyStr || '(New conversation)'}

STUDENT'S MESSAGE:
${input.message}

Respond as CareerAI Mentor:`;

  const result = await callGemini<ChatOutput>({
    systemPrompt: CHAT_SYSTEM_PROMPT,
    userPrompt,
    jsonMode: true,
    temperature: 0.7,
  });

  return result;
}
