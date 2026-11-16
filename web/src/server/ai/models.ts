import "server-only";

/**
 * Groq model registry.
 *
 * Free-tier limits on this account (read from `x-ratelimit-*` response headers, Nov 2026):
 *   1,000 requests / day and 8,000 tokens / minute per model.
 * Groq's published free tier also caps requests / minute and tokens / day; the defaults below
 * stay inside those. Every limit can be overridden with an env var (e.g. GROQ_TPM=12000) if the
 * account is upgraded.
 */
export type Tier = "reasoning" | "fast" | "vision";

export interface ModelSpec {
  id: string;
  label: string;
  vision?: boolean;
  /** Extra request params (reasoning controls differ per model family). */
  params: Record<string, unknown>;
}

const num = (name: string, fallback: number) => Number(process.env[name]) || fallback;

export const LIMITS = {
  rpm: num("GROQ_RPM", 30),
  rpd: num("GROQ_RPD", 1000),
  tpm: num("GROQ_TPM", 8000),
  tpd: num("GROQ_TPD", 200_000),
};

export const MODELS: Record<string, ModelSpec> = {
  "openai/gpt-oss-120b": {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    params: { reasoning_effort: "low", include_reasoning: false },
  },
  "qwen/qwen3.8-27b": {
    id: "qwen/qwen3.8-27b",
    label: "Qwen 3.8 27B",
    vision: true,
    params: { reasoning_effort: "none" },
  },
  "openai/gpt-oss-20b": {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    params: { reasoning_effort: "low", include_reasoning: false },
  },
};

/** Fallback order per task tier. The first model with spare capacity wins. */
export const TIERS: Record<Tier, string[]> = {
  reasoning: ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"],
  fast: ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"],
  vision: ["qwen/qwen3.8-27b"],
};

export const SPEECH_MODELS = ["whisper-large-v3-turbo", "whisper-large-v3"];

/** Rough token estimate (≈3.5 characters per token for English prompts). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}
