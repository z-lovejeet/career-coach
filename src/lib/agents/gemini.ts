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

  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
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
        // Retry on 503 (overloaded) or 429 (rate limit)
        if (status === 503 || status === 429) {
          const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
          console.warn(`Gemini ${model} returned ${status}, retrying in ${delay / 1000}s (attempt ${attempt + 1}/3)...`);
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
