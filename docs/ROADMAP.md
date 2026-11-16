# CareerCompass — Build Roadmap

Deadlines: **Wed 18 Nov** report + presentation · **Fri 20 Nov** live demo.
Design: [`superpowers/specs/2026-11-16-careercompass-design.md`](superpowers/specs/2026-11-16-careercompass-design.md)
Live log: [`PROGRESS.md`](PROGRESS.md)

Status keys: ⬜ not started · 🟨 in progress · ✅ done

## M0 — Groundwork (Mon 16) ✅
- ✅ Branch `redesign/careercompass`, design + roadmap + progress docs
- ✅ Restructure repo: `web/`, `ml/`, `data/`, `supabase/`, `docs/`
- ✅ Remove Gemini + old features

## M1 — Supervised learning on O*NET ✅
- ✅ Download O*NET 31.0 (scripted) → `data/raw/`
- ✅ Preprocess: 75-feature matrix (skills, knowledge, RIASEC, job zone), labels (occupation, family)
- ✅ Synthetic student dataset (noise + masking)
- ✅ Train + compare: LogReg, kNN, RandomForest, LinearSVM, MLP
- ✅ Metrics: stratified + unseen-occupation splits, robustness, ranking, calibration → `ml/reports/`
- ✅ Export deployed model JSON → `web/src/server/ml/model/`
- ✅ Alternate job titles index for career search
- 🟨 Report notebook (`ml/notebooks/career_matcher.ipynb`)

## M2 — Foundation ✅
- ✅ Supabase schema + RLS + RPCs (limiter, cache, quota) applied
- ✅ Groq layer: registry, token-aware limiter, cooldown fallback, cache, JSON validation, streaming, Whisper
- ✅ Design system, app shell, dark mode
- ✅ Splash screen, auth (email + Google), proxy route protection

## M3 — Onboarding ✅
- ✅ CV upload: pdf.js text extraction, scanned → vision OCR, contact scrubbing
- ✅ Immersive 8-step profile (education, skills, experience, RIASEC quiz, goals)
- ✅ Profile Analyst → O*NET vector → career matches

## M4 — Roadmap agent ✅
- ✅ 7-step pipeline with NDJSON streaming + persisted trace
- ✅ Graph view (course → skill → career) + timeline view + node inspector
- ✅ Edit, status, pace; "Ask the agent" with preview; AI suggestions; versions/restore
- ✅ Public samples page (3 agent-generated roadmaps)

## M5 — Dashboard + progress ✅
- ✅ Readiness (algorithmic), career matches, Company Scout (LLM + skill-overlap fit)
- ✅ Activity log, XP/level/streak, heatmap, next actions, weak topics

## M6 — Practice ✅
## M7 — Interviews ✅ (adaptive interviewer, Whisper voice, panel report)
## M8 — Mentor ✅ (plan → act → answer with tools, threads)

## M9 — Ship 🟨
- ✅ Tests (roadmap ops, RIASEC, links), lint, typecheck, production build
- ✅ README + CI for web + ML
- ⬜ Vercel: Root Directory → `web`, check env vars, deploy, smoke-test production (needs owner)
- ⬜ Supabase Auth: add production URL + `/auth/callback` to redirect URLs (needs owner)
- ⬜ Mobile pass, final polish
- ⬜ Merge `redesign/careercompass` → `main`
