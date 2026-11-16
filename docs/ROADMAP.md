# CareerCompass — Build Roadmap

Deadlines: **Wed 18 Nov** report + presentation · **Fri 20 Nov** live demo.
Design: [`superpowers/specs/2026-11-16-careercompass-design.md`](superpowers/specs/2026-11-16-careercompass-design.md)
Live log: [`PROGRESS.md`](PROGRESS.md)

Status keys: [ ] not started · [~] in progress · [x] done

## M0 — Groundwork (Mon 16) (done)
- [x] Branch `redesign/careercompass`, design + roadmap + progress docs
- [x] Restructure repo: `web/`, `ml/`, `data/`, `supabase/`, `docs/`
- [x] Remove Gemini + old features

## M1 — Supervised learning on O*NET (done)
- [x] Download O*NET 31.0 (scripted) → `data/raw/`
- [x] Preprocess: 75-feature matrix (skills, knowledge, RIASEC, job zone), labels (occupation, family)
- [x] Synthetic student dataset (noise + masking)
- [x] Train + compare: LogReg, kNN, RandomForest, LinearSVM, MLP
- [x] Metrics: stratified + unseen-occupation splits, robustness, ranking, calibration → `ml/reports/`
- [x] Export deployed model JSON → `web/src/server/ml/model/`
- [x] Alternate job titles index for career search
- [~] Report notebook (`ml/notebooks/career_matcher.ipynb`)

## M2 — Foundation (done)
- [x] Supabase schema + RLS + RPCs (limiter, cache, quota) applied
- [x] Groq layer: registry, token-aware limiter, cooldown fallback, cache, JSON validation, streaming, Whisper
- [x] Design system, app shell, dark mode
- [x] Splash screen, auth (email + Google), proxy route protection

## M3 — Onboarding (done)
- [x] CV upload: pdf.js text extraction, scanned → vision OCR, contact scrubbing
- [x] Immersive 8-step profile (education, skills, experience, RIASEC quiz, goals)
- [x] Profile Analyst → O*NET vector → career matches

## M4 — Roadmap agent (done)
- [x] 7-step pipeline with NDJSON streaming + persisted trace
- [x] Graph view (course → skill → career) + timeline view + node inspector
- [x] Edit, status, pace; "Ask the agent" with preview; AI suggestions; versions/restore
- [x] Public samples page (3 agent-generated roadmaps)

## M5 — Dashboard + progress (done)
- [x] Readiness (algorithmic), career matches, Company Scout (LLM + skill-overlap fit)
- [x] Activity log, XP/level/streak, heatmap, next actions, weak topics

## M6 — Practice (done)
## M7 — Interviews (done) (adaptive interviewer, Whisper voice, panel report)
## M8 — Mentor (done) (plan → act → answer with tools, threads)

## M9 — Ship (done; final owner checks pending)
- [x] Tests (roadmap ops, RIASEC, links), lint, typecheck, production build
- [x] README + CI for web + ML
- [x] Vercel: Root Directory → `web`, env vars present, region `bom1`, deployed; public smoke test passed
- [~] Supabase Auth redirect for production `/auth/callback` (owner to confirm by signing in with Google)
- [ ] Mobile pass, final polish
- [x] Merge `redesign/careercompass` → `main`
