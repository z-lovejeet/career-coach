import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

// ─── Clients (Lazy Loaded to ensure process.env is read at runtime) ─
function getGroqClient(): Groq {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
  });
}

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
  });
}

// ─── RPD Tracker for gemini-3.8-flash (Max 17 RPD) ───────────────────
interface RpdState {
  date: string;
  count: number;
}

const rpdTracker: RpdState = {
  date: new Date().toISOString().split('T')[0],
  count: 0,
};

export function getGemini38Usage(): { count: number; max: number; allowed: boolean } {
  const today = new Date().toISOString().split('T')[0];
  if (rpdTracker.date !== today) {
    rpdTracker.date = today;
    rpdTracker.count = 0;
  }
  return {
    count: rpdTracker.count,
    max: 17,
    allowed: rpdTracker.count < 17,
  };
}

export function recordGemini38Request(): void {
  const today = new Date().toISOString().split('T')[0];
  if (rpdTracker.date !== today) {
    rpdTracker.date = today;
    rpdTracker.count = 1;
  } else {
    rpdTracker.count += 1;
  }
  console.log(`[AI Tracker] gemini-3.8-flash usage today: ${rpdTracker.count}/17 RPD`);
}

// ─── Call Options ───────────────────────────────────────────────────
export interface AICallOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

// ─── Clean / Parse JSON helper ──────────────────────────────────────
function parseJsonSafe<T>(rawText: string): T {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Try matching inside markdown code fence
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1]) as T;
      } catch {
        // continue
      }
    }
    // Try finding the first '{' or '[' and last '}' or ']'
    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = trimmed.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = trimmed.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      const sliced = trimmed.slice(startIdx, endIdx + 1);
      return JSON.parse(sliced) as T;
    }

    throw new Error(`Failed to parse AI JSON response: ${trimmed.substring(0, 300)}`);
  }
}

// ─── Call Groq (Primary: openai/gpt-oss-120b) ────────────────────────
export async function callGroq<T = string>({
  systemPrompt,
  userPrompt,
  jsonMode = true,
  temperature = 0.7,
  maxTokens = 4096,
}: AICallOptions): Promise<T> {
  const models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
  let lastError: unknown;

  for (const model of models) {
    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (systemPrompt && systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: userPrompt || 'Hello' });

      const completion = await getGroqClient().chat.completions.create({
        model,
        messages,
        temperature,
        max_completion_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      });

      const content = completion.choices[0]?.message?.content || '';

      if (jsonMode) {
        return parseJsonSafe<T>(content);
      }

      return content as T;
    } catch (err) {
      lastError = err;
      console.warn(`[Groq] Model ${model} failed:`, (err as Error).message || err);
      // Try next model
    }
  }

  throw lastError || new Error('All Groq models failed');
}

// ─── Call Gemini (gemini-3.8-flash with fallback to gemini-3.5-flash-lite) ───
export async function callGemini<T = string>({
  systemPrompt,
  userPrompt,
  jsonMode = true,
  temperature = 0.6,
  maxTokens = 8192,
}: AICallOptions): Promise<T> {
  const usage = getGemini38Usage();
  
  // Decide model sequence based on 17 RPD limit
  const candidateModels: string[] = [];
  if (usage.allowed) {
    candidateModels.push('gemini-3.8-flash');
    candidateModels.push('gemini-3.5-flash-lite');
  } else {
    console.info(`[Gemini] Daily quota of 17 RPD reached on gemini-3.8-flash (${usage.count}/17). Routing directly to gemini-3.5-flash-lite.`);
    candidateModels.push('gemini-3.5-flash-lite');
  }

  let lastError: unknown;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: Record<string, unknown> = {
          temperature,
          maxOutputTokens: maxTokens,
          ...(systemPrompt && systemPrompt.trim() ? { systemInstruction: systemPrompt } : {}),
        };

        if (jsonMode) {
          config.responseMimeType = 'application/json';
        }

        const timeoutMs = model === 'gemini-3.8-flash' ? 6000 : 35000;
        let timeoutHandle: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`${model} request timed out after ${timeoutMs}ms`)),
            timeoutMs
          );
        });

        const response = await Promise.race([
          getGeminiClient().models.generateContent({
            model,
            contents: userPrompt || 'Respond with valid output',
            config,
          }),
          timeoutPromise,
        ]).finally(() => {
          clearTimeout(timeoutHandle);
        });

        const text = response.text || '';

        if (model === 'gemini-3.8-flash') {
          recordGemini38Request();
        }

        if (jsonMode) {
          return parseJsonSafe<T>(text);
        }

        return text as T;
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { status?: number }).status;
        const errMsg = (err as { message?: string }).message || '';

        console.warn(`[Gemini] ${model} attempt ${attempt + 1} failed (${status || 'unknown'}): ${errMsg.substring(0, 150)}`);

        // If 503 (high demand), 429 (rate limit), or timeout on 3.8-flash, immediately break to 3.5-flash-lite
        if (model === 'gemini-3.8-flash' && (status === 503 || status === 429 || status === 404 || errMsg.includes('timed out'))) {
          console.warn(`[Gemini] Switching from ${model} to gemini-3.5-flash-lite fallback immediately.`);
          break;
        }

        if (status === 429 || status === 503) {
          await new Promise((r) => setTimeout(r, 1500));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// ─── Unified AI Caller with Cross-Provider Fallback ───────────────────
export async function callAI<T = string>(
  options: AICallOptions,
  preferredProvider: 'groq' | 'gemini' = 'groq'
): Promise<T> {
  if (preferredProvider === 'groq') {
    try {
      return await callGroq<T>(options);
    } catch (groqErr) {
      console.warn('[AI Engine] Groq failed, falling back to Gemini 3.8/3.5 chain:', (groqErr as Error).message);
      return await callGemini<T>(options);
    }
  } else {
    try {
      return await callGemini<T>(options);
    } catch (geminiErr) {
      console.warn('[AI Engine] Gemini failed, falling back to Groq openai/gpt-oss-120b:', (geminiErr as Error).message);
      return await callGroq<T>(options);
    }
  }
}

// ─── Student Context Formatter ─────────────────────────────────────────
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
