# CareerCompass — Progress Log

Newest first. Each entry: what changed, what's verified, what's next / blocked.

## 2026-11-16

**Started the redesign.**
- Audited the old CareerAI codebase (findings in the session; main issues: shared guest account,
  quota failing open, README drift, broken test, Gemini dependency).
- Agreed approach: one Next.js app in `web/` + Python `ml/` pipeline; Groq only; Supabase kept.
- Environment checks:
  - Groq models available: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`
    (accepts images → used for CV OCR), Whisper (STT), Orpheus (TTS).
  - Free-tier limits (from response headers): **1,000 requests/day, 8,000 tokens/min per model**.
  - O*NET database is at **v31.0**; skills split into `essential_skills` and
    `transferable_skills`.
  - Supabase CLI is logged in; the `DATABASE_URL` password in `.env.local` is stale.
- Created branch `redesign/careercompass`, design doc, roadmap, this log.

Next: restructure repo, download O*NET, build the ML pipeline.
