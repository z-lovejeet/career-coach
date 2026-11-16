# CareerCompass — Design

Date: 2026-11-16 · Owner: Lovejeet Singh (B.Tech CSE AI/ML, LPU) · Builder: Claude

## 1. Intent

Rebuild the old hackathon project ("CareerAI") into **CareerCompass — Career & Education
Advisor**, a supervised learning course project (35 marks). Teacher's brief:

> Students lack a single place for personalized education-to-career planning. Build an agent
> that, given a student's interests/background, produces a multi-step roadmap
> (courses → skills → career) rather than a single generic answer.
> Deliverable: agent demo + 3 sample generated roadmaps. Dataset: O*NET Database.

The teacher grades the **live demo**, not the code. Hybrid ML + agentic AI is explicitly allowed;
agentic AI (Groq) should carry most of the product, with supervised learning where it fits.

**Dates:** report + presentation Wed 18 Nov 2026 · live demo Fri 20 Nov 2026.

## 2. Goals / non-goals / anti-goals

Goals
- Every feature live and data-driven. Nothing static or hardcoded (sample roadmaps are produced by
  the real agent and saved).
- A visible agent: each pipeline step streams to the UI (agent trace) so the demo shows reasoning.
- A real supervised model trained on O*NET, evaluated (multiple models compared) for the report.
- Premium, calm, hand-crafted UI. Not generic "AI slop" (no purple gradients, no emoji soup,
  no glassmorphism everywhere).
- Simple to deploy: one Vercel project + one Supabase project.

Non-goals
- Payments, teams, admin console, mobile app, i18n.

Anti-goals (failure even if it "works")
- Demo stalls because Groq hit a limit or a cold start.
- Roadmap is a generic list instead of courses → skills → career.
- Collecting contact info (phone/email) in the career profile.

## 3. Constraints

- **Groq only** (no Gemini). Free tier on this account: **1,000 requests/day and 8,000 tokens/minute
  per model** (read from `x-ratelimit-*` headers on 2026-11-16).
- Models available: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` (text + image,
  tools, JSON), `whisper-large-v3(-turbo)` (speech-to-text), `canopylabs/orpheus-v1-english` (TTS).
- Next.js 16 conventions (proxy not middleware, async request APIs).
- Supabase project "Career AI" (ref `wknqupploijgywkfnnzz`), existing Google OAuth config.
- Vercel deployment; Vercel project Root Directory must become `web`.

## 4. Approaches considered

1. **One Next.js app + Python `ml/` folder (chosen).** Train in Python/scikit-learn, export model
   weights to JSON, run inference in TypeScript. One deploy, no cold start, demo-safe.
   Trade-off: deployed model must be exportable (logistic regression / kNN / small MLP).
2. Next.js + separate FastAPI backend on Render/Railway. Real Python at runtime, but two deploys,
   cross-service auth, and free-tier sleep (30–60 s cold start) during the demo.
3. Next.js + Python serverless functions on Vercel. One deploy but scikit-learn/numpy near the
   250 MB bundle limit, slow cold starts, mixed-runtime debugging.

Chosen: **1**, by the owner ("start working now" after the recommendation).

## 5. Repository layout

```
careercompass/ (repo root)
├── web/                 Next.js 16 app (UI + API routes + agents)
│   ├── src/app/         routes (pages + api)
│   ├── src/components/  ui primitives + feature components
│   ├── src/server/      backend-only code (never imported by client)
│   │   ├── ai/          groq client, model registry, limiter, cache, json utils
│   │   ├── agents/      roadmap pipeline, interviewer, mentor, practice, cv parser
│   │   ├── ml/          career-matcher inference (loads exported model JSON)
│   │   ├── onet/        O*NET lookup helpers (occupations, skills, tech)
│   │   └── db/          supabase server/admin clients, queries
│   ├── src/lib/         shared isomorphic utils + types
│   └── public/model/    (none — model JSON lives in src/server/ml/model)
├── ml/                  Python: download → preprocess → synth dataset → train → evaluate → export
│   ├── notebooks/       report-friendly notebook
│   ├── src/             pipeline scripts
│   └── reports/         metrics.json, figures (confusion matrix, model comparison)
├── data/                raw/ (git-ignored O*NET CSVs) · processed/ (committed, small)
├── supabase/migrations/ SQL schema
└── docs/                ROADMAP.md, PROGRESS.md, ARCHITECTURE.md, report assets, samples
```

## 6. Supervised learning component (O*NET)

**Features (per occupation, from O*NET 31.0):** importance ratings of essential/transferable
skills, knowledge areas, RIASEC interest scores (career_interest_types), job zone (education level).
Normalised 0–1. ~120 numeric features.

**Labels:** (a) O*NET occupation (~900 classes, used for ranking) and (b) occupation family
(SOC major group, ~22 classes) for the classifier the report focuses on.

**Training data:** O*NET has one profile per occupation, so we synthesise student-like samples:
for each occupation draw N noisy, partially observed copies (Gaussian noise, random feature
dropout/masking, interest-score jitter) to mimic imperfect self-reports. Stratified train/test
split, with a held-out noise level for robustness testing.

**Models compared (report):** Logistic Regression (softmax), k-NN (cosine), Random Forest,
Linear SVM, MLP. Metrics: accuracy, macro-F1, top-3 accuracy, confusion matrix, per-family
precision/recall, robustness vs noise level.

**Deployed:** multinomial logistic regression for family probabilities + cosine similarity
against occupation profiles inside top families → ranked careers with match %. Exported as JSON
(scaler, weights, occupation matrix, feature names) and run in TypeScript.

**Hybrid glue (agentic):** an LLM "Profile Analyst" converts the free-form student profile
(education, subjects, skills, projects, interests quiz) into the O*NET feature vector. The ML model
then predicts careers. The roadmap agent consumes those predictions.

## 7. Agentic roadmap pipeline (courses → skills → career)

Streamed as NDJSON events to the client; every step is persisted in the roadmap's `trace`.

1. **Profile Analyst** (LLM): profile → O*NET feature vector + strengths summary.
2. **Career Matcher** (ML tool): top careers with probabilities and job zone.
3. **Target selection**: user's chosen career (or top match).
4. **Gap Analyzer** (code + O*NET): required skill/knowledge levels for the target vs student
   vector → ranked gaps; O*NET hot technologies for the occupation.
5. **Curriculum Planner** (LLM): courses (academic subjects + online courses with search links to
   NPTEL / Coursera / YouTube / freeCodeCamp — never invented URLs) mapped to the skills they build,
   prerequisites, effort.
6. **Roadmap Composer** (LLM): phases → milestones → nodes typed `course | skill | project |
   career`, with edges course→skill→career, durations sized to the student's hours/week.
7. **Critic** (code + LLM): checks every critical gap is covered, timeline fits; one revision pass
   if not.

Roadmap is then **interactive**: graph view (course → skill → career lanes with connecting edges),
timeline view (phases/milestones), node status (todo/doing/done), edit/add/remove/reorder nodes,
change pace, and **"Ask the agent"** to revise (LLM returns a validated patch). Versions saved.

## 8. Features

- **Splash / loading** screen → auth.
- **Auth:** email+password and Google (Supabase). Contact details never enter the career profile.
- **Immersive onboarding:** upload CV (PDF text extraction in the browser with pdf.js; scanned
  pages rendered to images → `qwen3.8-27b` vision OCR) → editable prefilled steps: education &
  academics, skills (self-rated), projects/experience/certifications/achievements, interests
  (12-item RIASEC quiz + interest areas), goals & preferences (target roles, industries, locations,
  hours/week, job vs higher studies). Contact info stripped server-side.
- **Dashboard (includes progress):** readiness score (algorithmic: O*NET requirement coverage +
  practice accuracy + interview scores + roadmap completion), top career matches (ML), company
  suggestions (AI, cached), roadmap progress, next actions, weak topics, activity heatmap,
  light gamification (XP, level, streak, a few milestones).
- **Practice (real-time):** academic (DSA, OS, DBMS, CN, OOP, Maths, ML…) and placement
  (quant, logical, verbal, coding concepts) subjects. Timed MCQ sessions with instant feedback and
  explanations. Questions come from a shared bank that grows via Groq generation; users get unseen
  questions first. Topic accuracy feeds the dashboard.
- **Interviews:** pick role/subject, company, difficulty, type (technical/HR/mixed). Adaptive AI
  interviewer (decides follow-up vs next question), optional voice (Groq Whisper speech-to-text,
  browser speech for the interviewer), final scored report.
- **Mentor:** streaming chat about career + academics with tool calls (career info from O*NET,
  career matching, the student's own progress/roadmap). Threads saved.
- **Samples page:** the 3 agent-generated sample roadmaps (public), each with its trace.

## 9. Groq layer (cache, limits, fallback)

- **Registry:** per task tier, ordered model list. `reasoning` → gpt-oss-120b → qwen3.8-27b →
  gpt-oss-20b; `fast` → gpt-oss-20b → qwen3.8-27b → gpt-oss-120b; `vision` → qwen3.8-27b;
  `stt` → whisper-large-v3-turbo → whisper-large-v3.
- **Limiter:** Postgres RPC tracks per-model requests/day and tokens/minute (estimated before the
  call, corrected after with `usage`). If a model would exceed its budget, or returns 429, it is put
  on cooldown (from `retry-after` / reset headers) and the next model is tried.
- **Cache:** `ai_cache` table keyed by SHA-256 of (task, prompt). TTL per task. Used for
  deterministic/shared work (CV extraction, profile analysis, company suggestions, career info,
  question bank).
- **Per-user quota:** hourly caps per action, fail closed.

## 10. Data model (Supabase, RLS on everything user-owned)

profiles · career_matches · roadmaps (graph, trace, settings, version, is_sample) · practice_questions
(shared bank) · practice_sessions · interviews · mentor_threads · mentor_messages ·
company_suggestions · activity (XP/streak event log) · private: ai_cache, groq_usage,
groq_cooldowns, user_quota.

## 11. Design language

Light, editorial, calm. Warm off-white canvas, ink text, one deep accent (teal/ink-green) plus a
warm secondary for highlights. Serif display headings + clean sans body + mono numerals.
Generous whitespace, fine 1px rules, real data visualisation, restrained motion. Dark mode.

## 12. Left to the builder

Exact copy, spacing, icon choices, chart styling, model hyper-parameters, prompt wording,
XP values, quiz items.
