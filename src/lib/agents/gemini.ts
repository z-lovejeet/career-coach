import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeminiCallOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Shared Gemini API client — all agents call through this.
 * Includes automatic retry with exponential backoff for transient errors.
 */
export async function callGemini<T = string>({
  systemPrompt,
  userPrompt,
  jsonMode = true,
  temperature = 0.7,
  maxTokens = 8192,
}: GeminiCallOptions): Promise<T> {
  const config: Record<string, unknown> = {
    temperature,
    maxOutputTokens: maxTokens,
  };

  if (jsonMode) {
    config.responseMimeType = 'application/json';
  }

  // Models ordered by free-tier quota: 3.1-flash-lite (15 RPM, 500 RPD), 2.5-flash-lite (10 RPM), 2.5-flash (5 RPM)
  const models = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            ...config,
            systemInstruction: systemPrompt,
          },
        });

        const text = response.text ?? '';

        if (jsonMode) {
          try {
            return JSON.parse(text) as T;
          } catch {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[1]) as T;
            }
            throw new Error(`Failed to parse Gemini JSON response: ${text.substring(0, 200)}`);
          }
        }

        return text as T;
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { status?: number }).status;
        const errMsg = (err as { message?: string }).message || '';
        
        if (status === 429) {
          // Extract retry delay from error message if present
          const retryMatch = errMsg.match(/retry in (\d+)/i);
          const suggestedDelay = retryMatch ? parseInt(retryMatch[1]) : 0;
          const delay = Math.max(suggestedDelay * 1000, Math.pow(3, attempt + 1) * 3000); // 9s, 27s, 81s
          console.warn(`Gemini ${model} rate limited (429), retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/3)...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (status === 503) {
          const delay = Math.pow(2, attempt + 1) * 1000;
          console.warn(`Gemini ${model} overloaded (503), retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        // For 404 (model not found) or 403 (denied), skip to next model
        if (status === 404 || status === 403) {
          console.warn(`Model ${model} returned ${status}, trying fallback...`);
          break;
        }
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * Helper to build context strings from student data.
 */
export function buildStudentContext(profile: {
  skills?: string[];
  skill_ratings?: Record<string, number>;
  goals?: string[];
  experience_level?: string;
  education_level?: string;
  field_of_study?: string;
  preferred_role?: string;
}): string {
  const parts: string[] = [];

  if (profile.skills?.length) {
    parts.push(`Skills: ${profile.skills.join(', ')}`);
  }
  if (profile.skill_ratings && Object.keys(profile.skill_ratings).length) {
    const ratings = Object.entries(profile.skill_ratings)
      .map(([skill, rating]) => `${skill}: ${rating}/10`)
      .join(', ');
    parts.push(`Skill Ratings: ${ratings}`);
  }
  if (profile.goals?.length) {
    parts.push(`Career Goals: ${profile.goals.join(', ')}`);
  }
  if (profile.experience_level) {
    parts.push(`Experience Level: ${profile.experience_level}`);
  }
  if (profile.education_level) {
    parts.push(`Education: ${profile.education_level} in ${profile.field_of_study || 'Computer Science'}`);
  }
  if (profile.preferred_role) {
    parts.push(`Target Role: ${profile.preferred_role}`);
  }

  return parts.join('\n');
}
