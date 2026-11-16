# CareerCompass — Build Roadmap

Deadlines: **Wed 18 Nov** report + presentation · **Fri 20 Nov** live demo.
Design: [`superpowers/specs/2026-11-16-careercompass-design.md`](superpowers/specs/2026-11-16-careercompass-design.md)
Live log: [`PROGRESS.md`](PROGRESS.md)

Status keys: ⬜ not started · 🟨 in progress · ✅ done

## M0 — Groundwork (Mon 16)
- ⬜ Branch `redesign/careercompass`, design + roadmap + progress docs
- ⬜ Restructure repo: `web/`, `ml/`, `data/`, `supabase/`, `docs/`
- ⬜ Remove Gemini + old features; keep reusable pieces (Supabase clients, resume path checks)

## M1 — Supervised learning on O*NET (Mon 16 → Tue 17) · needed for the report
- ⬜ Download O*NET 31.0 (scripted) → `data/raw/`
- ⬜ Preprocess: feature matrix (skills, knowledge, RIASEC, job zone), labels (occupation, family)
- ⬜ Synthetic student dataset (noise + masking), stratified split
- ⬜ Train + compare: LogReg, kNN, RandomForest, LinearSVM, MLP
- ⬜ Metrics: accuracy, macro-F1, top-3, confusion matrix, robustness vs noise → `ml/reports/`
- ⬜ Export deployed model JSON → `web/src/server/ml/model/`
- ⬜ Notebook for the report

## M2 — Foundation (Tue 17)
- ⬜ Supabase schema + RLS + RPCs (limiter, cache, quota) migration applied
- ⬜ Groq layer: registry, token-aware limiter, cooldown fallback, cache, JSON validation, streaming
- ⬜ Design system: tokens, type, primitives, app shell, dark mode
- ⬜ Splash screen, auth (email + Google), proxy route protection

## M3 — Onboarding (Tue 17)
- ⬜ CV upload: pdf.js text extraction, scanned → image → vision OCR, contact scrubbing
- ⬜ Immersive multi-step profile (education, skills, experience, interests quiz, goals)
- ⬜ Profile Analyst → O*NET vector → career matches saved

## M4 — Roadmap agent (Wed 18)
- ⬜ 7-step pipeline with NDJSON streaming + persisted trace
- ⬜ Graph view (course → skill → career) + timeline view
- ⬜ Edit nodes, status, pace; "Ask the agent" revisions with validated patches; versions
- ⬜ Public samples page (3 agent-generated roadmaps)

## M5 — Dashboard + progress (Wed 18)
- ⬜ Readiness score (algorithmic), career matches, company suggestions (AI, cached)
- ⬜ Activity log, XP/level/streak, heatmap, next actions, weak topics

## M6 — Practice (Thu 19)
- ⬜ Subjects/topics catalogue, shared question bank, generation on demand
- ⬜ Timed sessions, instant feedback, explanations, topic accuracy

## M7 — Interviews (Thu 19)
- ⬜ Setup (role/subject, company, difficulty, type), adaptive interviewer
- ⬜ Voice: Whisper STT + browser speech; final report

## M8 — Mentor (Thu 19)
- ⬜ Streaming chat with tools (O*NET career info, matcher, my progress), threads

## M9 — Ship (Thu 19 → Fri 20)
- ⬜ Generate 3 sample roadmaps with the live agent
- ⬜ Tests (limiter, matcher, validators), lint, typecheck, build
- ⬜ Vercel: root dir `web`, env vars, deploy, smoke test production
- ⬜ README + architecture doc for the report
