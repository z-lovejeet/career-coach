<p align="center">
  <img src="public/logo.png" alt="CareerAI Logo" width="88" height="88" style="border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);" />
</p>

<h1 align="center">CareerAI — Autonomous Agentic Placement Mentor</h1>

<p align="center">
  <strong>Autonomous placement intelligence for elite software engineers, powered by a 7-agent decoupled syndicate, dual-AI runtime (Groq GPT-OSS 120B + Gemini 3.8 Flash), and an Obsidian & Titanium design architecture.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2.3-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://groq.com"><img src="https://img.shields.io/badge/Groq-GPT--OSS_120B-f55036?logo=groq&logoColor=white" alt="Groq" /></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini-3.8_Flash-4285F4?logo=google&logoColor=white" alt="Gemini" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Postgres_%2B_RLS-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?logo=tailwind-css" alt="Tailwind" /></a>
  <a href="https://github.com/obra/superpowers"><img src="https://img.shields.io/badge/Superpowers-v7.0.1-6366F1" alt="Superpowers" /></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> •
  <a href="#dual-ai-runtime-architecture">Dual AI Runtime</a> •
  <a href="#the-7-agent-syndicate">7-Agent Syndicate</a> •
  <a href="#design-system--zero-ai-slop">Design System</a> •
  <a href="#routes--features">Features & Routes</a> •
  <a href="#auth--guest-mode">Guest Mode</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a>
</p>

---

## The Problem

Traditional placement prep platforms and generic chatbots fall flat:
1. **One-Size-Fits-All Preparation:** Weak areas are ignored, while candidate strengths are repetitively drilled.
2. **Passive Chatbot Paradigms:** Standard AI assistants wait passively for student prompts. When students procrastinate or drop below target velocity, nothing intervenes.
3. **Generic AI Hallucinations & AI-Slop Interfaces:** Low-contrast text, neon gradient blobs, and cookie-cutter question generators that fail to replicate real FAANG / Tier-1 technical rubrics.

## The Solution

**CareerAI** transforms placement coaching into an **active, autonomous operating system**:
- **Proactive Interventions:** The **Autonomous Alert Engine (Agent #7)** continuously audits student velocity, topic gaps, and practice streaks, surfacing proactive nudges without waiting for a prompt.
- **Dual-AI Runtime:** Real-time **Groq GPT-OSS 120B** (~280 tok/sec) for instantaneous Socratic feedback and rubric evaluations, backed by **Google Gemini 3.8 Flash** with automatic fallback for multimodal PDF resume deep-reasoning.
- **Obsidian, Slate & Titanium Design System:** Built following the official **Superpowers** design framework, providing a Linear / Stripe-caliber dark workspace with zero visual AI-slop.

---

## Dual AI Runtime Architecture

CareerAI pairs Groq's high-throughput LPU inference with Google Gemini's multimodal reasoning through a resilient fallback chain:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CAREERAI DUAL RUNTIME                           │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
            [REAL-TIME REASONING]             [MULTIMODAL DEEP REASONING]
                    │                                │
          ┌─────────▼─────────┐            ┌─────────▼─────────┐
          │     Groq API      │            │   Google Gemini   │
          │ openai/gpt-oss-120b│            │ gemini-3.8-flash  │
          │  (~280 tok/sec)   │            │ (Multimodal PDF)  │
          └─────────┬─────────┘            └─────────┬─────────┘
                    │                                │ (Quota >17 RPD or 429?)
                    │                                ▼
                    │                      ┌───────────────────┐
                    │                      │   Google Gemini   │
                    │                      │gemini-3.5-flash-lite│
                    │                      │(Resilient Fallback│
                    │                      └─────────┬─────────┘
                    │                                │
                    └───────────────┬────────────────┘
                                    ▼
                         [AGENT SYNDICATE CORE]
```

### AI Routing Strategy:
- **Groq `openai/gpt-oss-120b` (Primary):** Powers the Socratic Mock Interview terminal, live rubric grading, daily sprint task generation, and contextual AI chat mentor with sub-400ms latency.
- **Gemini `gemini-3.8-flash` (Multimodal Ingestion):** Handles full-fidelity PDF resume parsing, skill extraction, and candidate dossier calibration.
- **Gemini `gemini-3.5-flash-lite` (Graceful Fallback):** Automatically absorbs traffic when daily quotas (17 RPD on 3.8) or rate limits are reached, maintaining **100% platform uptime**.

---

## The 7-Agent Syndicate

CareerAI separates concerns across 7 specialized, autonomous agents:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AGENT PIPELINE                                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌───────────────────┬─────────────┴─────┬───────────────────┐
     │                   │                   │                   │
┌────▼─────────────┐┌────▼─────────────┐┌────▼─────────────┐┌────▼─────────────┐
│ 01. Profile      ││ 02. Roadmap      ││ 03. Interview    ││ 04. Socratic     │
│     Analyzer     ││     Architect    ││     Evaluator    ││     Chat Mentor  │
│ Multimodal PDF & ││ Dynamic phases & ││ Real-time rubric ││ Context-aware    │
│ skill taxonomy   ││ dream company    ││ & nuance scoring ││ placement coach  │
└──────────────────┘└──────────────────┘└──────────────────┘└──────────────────┘
     │                   │                   │                   │
     └───────────────────┼───────────────────┴───────────────────┘
                         │
     ┌───────────────────┴───────────────────┐
     │                                       │
┌────▼─────────────┐                   ┌────▼─────────────┐
│ 05. Daily Sprint │                   │ 06. Company Match │
│     Planner      │                   │     & Job Radar   │
│ Adaptive tasks   │                   │ Live LinkedIn     │
│ & weakness drill │                   │ roles & fit score │
└────┬─────────────┘                   └────┬─────────────┘
     │                                       │
     └───────────────────┬───────────────────┘
                         ▼
             ┌───────────────────────┐
             │ 07. PROACTIVE ENGINE  │
             │ Autonomous background │
             │ telemetry & alerts    │
             └───────────────────────┘
```

1. **Profile Analyzer Agent (`src/lib/agents/analyzer.ts`):** Parses resumes with Gemini multimodal vision, extracts hard and soft skills, grades proficiencies (1–10), and computes the 0–100 Placement Readiness Score.
2. **Roadmap Architect Agent (`src/app/api/roadmap/route.ts`):** Synthesizes target company requirements (e.g., Google L4, Stripe Core), available weekly hours, and timeline to generate weekly milestone syllabi with curated learning docs and videos.
3. **Interview Mentor Agent (`src/lib/agents/interview.ts`):** Socratic interviewer evaluating code, algorithms, and system design in real-time with granular rubrics (topics covered, nuances missed, mentor advice).
4. **Chat Mentor Agent (`src/lib/agents/chat.ts`):** Persistent mentor with complete candidate context loaded prior to user input. Includes syntax-highlighted code generation and 1-click clipboard actions.
5. **Task Planner Agent (`src/lib/agents/planner.ts`):** Generates structured Monday–Sunday practice sprints tailored to closing identified skill gaps.
6. **Company Recommender Agent (`src/lib/agents/recommendation.ts`):** Evaluates candidate dossiers against real-world job criteria and live LinkedIn postings via Apify.
7. **Proactive Alert Engine (`src/app/api/alerts/`):** Evaluates database activity logs silently, triggering autonomous notifications when practice lapses occur or deadlines approach.

---

## Design System — Zero AI-Slop

The entire user interface was redesigned from scratch using the **Obsidian, Slate & Titanium** design token architecture:

| Design Dimension | CareerAI Specification | Anti-Slop Safeguards |
|---|---|---|
| **Backgrounds** | `#08090C` (Obsidian Foundation) | ❌ No purple/cyan gradient blobs or generic meshes |
| **Surfaces** | `#0E111A` (Single-bezel elevated card) | ❌ No double/triple nested cards with bloated padding |
| **Borders** | `rgba(255, 255, 255, 0.08)` (Crisp Titanium) | ❌ No blurry drop-shadows or neon glow borders |
| **Typography** | Plus Jakarta Sans with `-0.025em` tracking | ❌ No oversized, low-contrast headings |
| **Numerics** | JetBrains Mono with `.tabular-nums` | ❌ Zero score jitter during live telemetry updates |
| **Status Dots** | Technical mono badges with emerald beacons | ❌ No emojis used as interface icons |

---

## Routes & Features

### Public & Authentication
- **`/` — Landing Page:** Asymmetrical editorial hero, live hardware telemetry cockpit (3 views: Socratic, Rubric, Radar), 6-agent pipeline matrix, 4-stage candidate protocol, and 1-click instant guest access.
- **`/auth` — Authentication Gateway:** Segmented tabbed switcher (Sign In vs Create Account), 1-click guest login with zero setup, Google OAuth with diagnostic setup modal.

### Authenticated Workspace Shell (`/app`)
- **`/dashboard` — Executive Command Center:** Stroke-animated SVG placement readiness gauge, 6 tabular KPI stat tiles, proactive mentor telemetry banner, recent tasks, and company matches radar.
- **`/profile` — Candidate Dossier:** Verified developer handles (GitHub, LinkedIn), PDF resume ingestion zone with Gemini status, self-rated skill taxonomy matrix (1–10 scores), and full AI analysis report.
- **`/tasks` — Daily Practice Board:** Active sprint header with Groq 120B task generator, sprint completion progress bar, domain & week filter dropdowns, weekday schedule (Mon–Sun), and interactive check toggles.
- **`/companies` — Company Matchmaker & Radar:** Dual-mode segmented switcher (AI Fit Radar vs Live LinkedIn Roles), match cards with fit scores, tier badges, matching skills, and gap skills, plus live job postings with salary tags and direct apply links.
- **`/roadmap` — Dynamic Prep Roadmap:** Interactive roadmap configuration form with dream company chips, dual-slider for timeline & daily commitment, curriculum domains, readiness projection bars, interview targets, skill gap matrix, and week-by-week phase timeline with curated video/doc learning resources.
- **`/interview` — Socratic Mock Interview Suite:** Topic & difficulty setup lobby, active interview terminal cockpit with question prompt, code/thought textarea with character counter, real-time rubric feedback (score / 100, topics covered, nuances missed, mentor tip), and historical interview dossiers table.
- **`/chat` — AI Mentor Socratic Chat:** Groq 120B telemetry pill, starter prompt chips, user and assistant message bubbles with markdown formatting, syntax highlighting, 1-click code copy button, and auto-expanding input bar with `Return ↵` shortcut.
- **`/progress` — Progress Analytics & Mastery:** 4 executive metric cards (Streak, Level/XP, Tasks Completed, Badges), 90-day activity heatmap with emerald intensity tiles, domain mastery progress bars, XP attribution breakdown, and candidate placement badges grid.
- **`/onboarding` — Candidate Calibration Flow:** 6-stage calibration wizard (Basic Info, Resume Ingestion, Skills, Projects, Target Goals, Portfolio Links) with type-safe selects and dossier summary preview.

---

## Auth & Guest Mode

CareerAI supports both full credential accounts and **Instant 1-Click Guest Exploration**:

```
[Explore as Guest Candidate]
           │
           ▼
  POST /api/auth/guest
           │
           ├─► Creates or restores pre-calibrated L4 candidate dossier
           ├─► Sets signed server-side session cookie ('sb-career-auth-token')
           └─► Immediately redirects to /dashboard with full features unlocked
```

- **Zero Friction:** Recruiters, judges, and developers can test the full platform immediately without needing to register or verify emails.
- **Persistent State:** Guest sessions maintain their roadmaps, completed tasks, and mock interview scores in the database via server-side session cookies.

---

## Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16.2.3 (App Router & Turbopack) | Fast full-stack React framework with server components and route handlers |
| **Primary AI Inference** | Groq SDK (`openai/gpt-oss-120b`) | Ultra-low latency LLM inference (~280 tok/sec) for real-time interview & chat |
| **Multimodal AI** | Google Gemini (`@google/genai`) | `gemini-3.8-flash` with dynamic fallback to `gemini-3.5-flash-lite` |
| **Database & Auth** | Supabase Postgres + RLS | Managed Postgres database with Row Level Security, Auth, and Storage |
| **Styling** | Tailwind CSS v4 | Utility-first CSS engine with bespoke Obsidian & Titanium design tokens |
| **Icons** | Lucide React | Clean, consistent geometric icons replacing all emojis |
| **Components** | Radix / Base UI Primitives | Accessible dialog, sheet, select, and tab primitives |
| **State & Cache** | SWR + Local Storage | Real-time client-side revalidation with offline resilience |
| **Live Job Scraping** | Apify LinkedIn Jobs Scraper | Real-time extraction of live software engineering postings |

---

## Project Structure

```
career-coach/
├── docs/
│   ├── CareerAI-Documentation.html   # Full technical project documentation
│   └── superpowers/plans/            # Superpowers master execution plans
├── public/
│   ├── logo.png                      # Brand mark
│   └── screenshots/                  # High-resolution UI captures
├── src/
│   ├── app/
│   │   ├── (app)/                    # Authenticated workspace layout & pages
│   │   │   ├── chat/page.tsx         #   AI Mentor Socratic Chat
│   │   │   ├── companies/page.tsx    #   Company Matchmaker & Radar
│   │   │   ├── dashboard/page.tsx    #   Executive Command Center
│   │   │   ├── interview/page.tsx    #   Mock Interview Terminal
│   │   │   ├── onboarding/           #   6-Stage Calibration Flow
│   │   │   ├── profile/page.tsx      #   Candidate Dossier & CV Analysis
│   │   │   ├── progress/page.tsx     #   90-Day Heatmap & Analytics
│   │   │   ├── roadmap/page.tsx      #   Dynamic Prep Roadmap
│   │   │   ├── tasks/page.tsx        #   Daily Practice Sprint Board
│   │   │   └── layout.tsx            #   Obsidian App Shell (Sidebar & Topbar)
│   │   ├── api/                      # 14 Full-Stack Route Handlers
│   │   │   ├── alerts/check/         #   Autonomous Alert Engine
│   │   │   ├── analyze/              #   Gemini Multimodal Profile Analyzer
│   │   │   ├── auth/guest/           #   1-Click Instant Guest Access
│   │   │   ├── chat/                 #   Groq 120B Chat Streaming
│   │   │   ├── companies/            #   Company Matchmaker
│   │   │   ├── dashboard/            #   Executive Metric Aggregator
│   │   │   ├── interview/            #   Socratic Mock Interview Engine
│   │   │   ├── jobs/                 #   Apify LinkedIn Job Scraper
│   │   │   ├── onboarding/           #   PDF Resume Extraction
│   │   │   ├── roadmap/              #   Roadmap Architect
│   │   │   ├── streak/               #   Gamification & XP Engine
│   │   │   └── tasks/                #   Daily Sprint Task Generator
│   │   ├── auth/page.tsx             # Auth Gateway (Sign in, Register, Guest)
│   │   ├── globals.css               # Obsidian & Titanium Design System
│   │   ├── layout.tsx                # Root HTML & Metadata Shell
│   │   └── page.tsx                  # Landing Page & Telemetry Cockpit
│   ├── components/ui/                # Modernized UI Components (Button, Card, Input...)
│   ├── lib/
│   │   ├── agents/                   # Agent implementations
│   │   │   ├── ai.ts                 #   Dual AI Runtime (Groq 120B + Gemini 3.8/3.5)
│   │   │   ├── analyzer.ts           #   Profile Analyzer logic
│   │   │   ├── chat.ts               #   Socratic Chat logic
│   │   │   ├── interview.ts          #   Interview Evaluator logic
│   │   │   ├── planner.ts            #   Task Planner logic
│   │   │   └── recommendation.ts     #   Company Fit logic
│   │   ├── supabase/                 # Supabase client & server instances
│   │   └── utils.ts                  # Shared helpers
│   ├── middleware.ts                 # Server-side Auth Guard & Redirects
│   └── types/index.ts                # TypeScript interfaces
├── supabase-schema.sql               # Complete Postgres DDL with RLS policies
├── .env.local.example                # Environment variable template
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites
- **Node.js:** v18.0 or higher
- **Package Manager:** `npm`, `pnpm`, or `yarn`
- **Supabase Account:** [supabase.com](https://supabase.com)
- **Groq API Key:** [console.groq.com](https://console.groq.com)
- **Google Gemini API Key:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/z-lovejeet/career-coach.git
cd career-coach
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.local.example .env.local
```
Open `.env.local` and provide your API keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
APIFY_API_TOKEN=your-apify-token # Optional: for live LinkedIn jobs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Initialize Database Schema
In your Supabase project's **SQL Editor**, paste and execute the contents of [`supabase-schema.sql`](file:///Users/lovejeetsingh1/Documents/Hack-AI-Project/career-coach/supabase-schema.sql). This provisions all required tables, foreign keys, and Row Level Security (RLS) policies.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Tip:** Click **"Instant Guest Mode"** on the landing page or auth screen to instantly test all 10 authenticated features with a pre-populated L4 candidate profile.

---

## Verification & Build
To verify the production build locally:
```bash
npm run build
```
Builds statically and dynamically across all 33 routes in ~2 seconds with **zero TypeScript errors and zero warnings**.

---

## License
Built for the Google AI Hackathon. Released under the [MIT License](LICENSE).
