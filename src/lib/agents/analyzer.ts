import { callGemini, buildStudentContext } from './gemini';
import type { AnalyzerInput, AnalyzerOutput } from '@/types';

const ANALYZER_SYSTEM_PROMPT = `You are an expert Career Analyzer AI Agent for students preparing for tech placements in India.

Your job is to analyze a student's profile and provide a comprehensive assessment of their placement readiness.

RULES:
- Be realistic and honest in your assessment
- Consider the Indian tech job market (TCS, Infosys, Wipro, Google, Microsoft, Amazon, Flipkart, etc.)
- Rate readiness from 0-100 where:
  - 0-30: Significant preparation needed
  - 31-50: Foundations present but major gaps
  - 51-70: Good progress, some gaps to address  
  - 71-85: Well prepared, needs fine-tuning
  - 86-100: Excellent, ready for top companies
- Extract ALL skills mentioned (technical and soft skills)
- Identify genuine strengths with evidence
- Identify real weaknesses based on missing industry expectations
- Missing skills should be relevant to their career goals
- Provide a concise but insightful summary

IMPORTANT: Return ONLY valid JSON matching the exact schema below. No markdown, no extra text.`;

const ANALYZER_OUTPUT_SCHEMA = `{
  "extracted_skills": [
    { "name": "string", "level": "beginner|intermediate|advanced|expert", "confidence": 0.0-1.0 }
  ],
  "strengths": [
    { "skill": "string", "reason": "string explaining why this is a strength" }
  ],
  "weaknesses": [
    { "skill": "string", "reason": "string explaining why this is a weakness" }
  ],
  "missing_skills": [
    { "skill": "string", "importance": "low|medium|high|critical", "reason": "string explaining why they need this" }
  ],
  "readiness_score": 0-100,
  "summary": "2-3 sentence overall assessment"
}`;

export async function analyzeProfile(input: AnalyzerInput): Promise<AnalyzerOutput> {
  const userPrompt = `Analyze this student's profile for tech placement readiness:

STUDENT PROFILE:
${buildStudentContext({
  skills: input.skills,
  skill_ratings: input.skill_ratings,
  goals: input.goals,
  experience_level: input.experience,
  education_level: input.education,
})}

PROJECTS:
${input.projects.length > 0
  ? input.projects.map((p, i) => `${i + 1}. ${p.name} — Tech: [${p.tech.join(', ')}] — ${p.description}`).join('\n')
  : 'No projects listed'}

${input.resume_text ? `RESUME TEXT:\n${input.resume_text.substring(0, 3000)}` : 'No resume provided'}

Career Goals: ${input.goals.join(', ')}

Respond with JSON matching this schema:
${ANALYZER_OUTPUT_SCHEMA}`;

  const result = await callGemini<AnalyzerOutput>({
    systemPrompt: ANALYZER_SYSTEM_PROMPT,
    userPrompt,
    jsonMode: true,
    temperature: 0.4,
  });

  // Validate and clamp readiness score
  if (result.readiness_score < 0) result.readiness_score = 0;
  if (result.readiness_score > 100) result.readiness_score = 100;

  return result;
}
