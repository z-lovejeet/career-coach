import { callGemini } from './gemini';
import type { RecommendationInput, RecommendationOutput } from '@/types';

const RECOMMENDATION_SYSTEM_PROMPT = `You are an expert Career Recommendation AI Agent specializing in the Indian tech job market.

Your job is to recommend REAL companies that match a student's current skills, and identify TARGET companies they can reach with more preparation.

RULES:
- Use ONLY REAL companies that actively hire in India (e.g., Google, Microsoft, Amazon, Flipkart, Razorpay, Zerodha, Atlassian, Adobe, Goldman Sachs, Morgan Stanley, TCS, Infosys, Wipro, HCL, Tech Mahindra, Zoho, Freshworks, PhonePe, Swiggy, Zomato, CRED, Meesho, Groww, Paytm, Ola, Uber, etc.)
- Match scores should be realistic (0-100)
- Current fit = companies where they could get hired NOW
- Target = aspirational companies that need more preparation
- Skill gaps should be specific and actionable
- Roadmap should be month-by-month, practical, and achievable
- Consider the student's experience level (fresher vs experienced)
- Consider their preferred locations
- Recommend 4-6 current fit and 3-5 target companies

IMPORTANT: Return ONLY valid JSON matching the exact schema below. No markdown, no extra text.`;

const RECOMMENDATION_OUTPUT_SCHEMA = `{
  "current_fit_companies": [
    {
      "name": "Real Company Name",
      "role": "Specific Job Title",
      "match_score": 0-100,
      "matching_skills": ["skill1", "skill2"],
      "reason": "Why this is a good fit right now"
    }
  ],
  "target_companies": [
    {
      "name": "Real Company Name",  
      "role": "Specific Job Title",
      "match_score": 0-100,
      "required_skills": ["skill1", "skill2"],
      "gap_skills": ["missing_skill1", "missing_skill2"],
      "reason": "Why this is a target and what's needed",
      "estimated_timeline": "X months"
    }
  ],
  "skill_gaps": [
    {
      "skill": "string",
      "current_level": "none|beginner|intermediate",
      "required_level": "intermediate|advanced|expert",
      "priority": "low|medium|high|critical"
    }
  ],
  "roadmap_to_target": [
    {
      "month": 1,
      "focus": "Main focus area",
      "tasks": ["Specific task 1", "Specific task 2", "Specific task 3"]
    }
  ]
}`;

export async function recommendCompanies(input: RecommendationInput): Promise<RecommendationOutput> {
  const skillsSummary = input.analysis.extracted_skills
    .map(s => `${s.name} (${s.level})`)
    .join(', ');

  const strengthsSummary = input.analysis.strengths
    .map(s => s.skill)
    .join(', ');

  const weaknessesSummary = input.analysis.weaknesses
    .map(w => w.skill)
    .join(', ');

  const missingSummary = input.analysis.missing_skills
    .map(m => `${m.skill} (${m.importance})`)
    .join(', ');

  const userPrompt = `Based on this student profile analysis, recommend real companies and provide a career roadmap:

ANALYSIS RESULTS:
- Readiness Score: ${input.analysis.readiness_score}/100
- Skills: ${skillsSummary}
- Strengths: ${strengthsSummary}
- Weaknesses: ${weaknessesSummary}
- Missing Skills: ${missingSummary}
- Summary: ${input.analysis.summary}

STUDENT PREFERENCES:
- Career Goals: ${input.goals.join(', ')}
- Preferred Locations: ${input.preferred_locations.join(', ') || 'Any'}
- Experience Level: ${input.experience_level}

Respond with JSON matching this schema:
${RECOMMENDATION_OUTPUT_SCHEMA}`;

  const result = await callGemini<RecommendationOutput>({
    systemPrompt: RECOMMENDATION_SYSTEM_PROMPT,
    userPrompt,
    jsonMode: true,
    temperature: 0.5,
  });

  return result;
}
