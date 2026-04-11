<p align="center">
  <img src="public/logo.png" alt="CareerAI Logo" width="80" height="80" style="border-radius: 20px;" />
</p>

<h1 align="center">CareerAI — Your Agentic Career Mentor</h1>

<p align="center">
  <strong>An AI-powered placement preparation platform with 7 autonomous agents, proactive coaching, and gamified learning.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#agents">Agents</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## The Problem

College placement training is **one-size-fits-all**. Weak students fall behind, strong students aren't challenged, and Training & Placement Cells cannot scale personal mentorship to hundreds of students. Resumes are built blindly, interview prep is generic, and there's no accountability system.

## The Solution

CareerAI is a **proactive, agentic AI career coach** that:

- **Parses your resume** with AI to extract skills, projects, and education automatically
- **Assesses your readiness** with a 0–100 placement score and identifies exact skill gaps
- **Builds personalized roadmaps** week-by-week, tailored to your dream company
- **Conducts mock interviews** with adaptive difficulty and real-time scoring
- **Nudges you proactively** when you miss deadlines or ignore weak areas

> **What makes it "Agentic"?** Standard chatbots wait for prompts. CareerAI's Alert Engine autonomously monitors your progress and intervenes without being asked — that's the difference between a chatbot and an agent.

---

## Features

| Feature | Description |
|---|---|
| 🧠 **AI Resume Analysis** | Upload a PDF → AI extracts skills, projects, education and auto-fills your profile |
| 📊 **Readiness Score** | 0–100 placement readiness assessment with strengths, weaknesses, and missing skills |
| 🗺️ **Personalized Roadmaps** | Multi-phase, week-by-week study plans tailored to your dream company and available hours |
| 🎤 **Mock Interviews** | AI-conducted technical interviews with real-time answer evaluation |
| 💬 **Context-Aware Chat** | AI mentor that knows your profile, score, and gaps before you type |
| 🏢 **Company Recommendations** | Live job matching via LinkedIn/Apify integration |
| 🔔 **Proactive Alert Engine** | Autonomous nudges when you slack off or miss targets |
| 🔥 **Gamification** | Streaks, XP, levels, 12 achievements, and confetti celebrations |
| 📋 **Daily Task Generation** | AI auto-assigns daily practice tasks based on detected weaknesses |

---

## Architecture

### The 7-Agent System

```
┌─────────────────────────────────────────────────────────┐
│                      USER INTERFACE                      │
│   Landing → Auth → Onboarding → Dashboard → Features    │
└────────────┬────────────────────────────────┬────────────┘
             │                                │
     ┌───────▼────────┐              ┌────────▼───────┐
     │  Profile        │              │  Roadmap       │
     │  Analyzer       │              │  Architect     │
     │  Agent (#1)     │              │  Agent (#2)    │
     └───────┬─────────┘              └────────┬───────┘
             │                                │
     ┌───────▼────────┐              ┌────────▼───────┐
     │  Interview      │              │  Chat          │
     │  Mentor         │              │  Mentor        │
     │  Agent (#3)     │              │  Agent (#4)    │
     └───────┬─────────┘              └────────┬───────┘
             │                                │
     ┌───────▼────────┐              ┌────────▼───────┐
     │  Task Planner   │              │  Recommender   │
     │  Agent (#5)     │              │  Agent (#6)    │
     └───────┬─────────┘              └────────┬───────┘
             │                                │
             └──────── ┌──────────┐ ──────────┘
                       │ Supabase │
                       │    DB    │
                       └────┬─────┘
                            │
                    ┌───────▼────────┐
                    │  ALERT ENGINE  │
                    │  Agent (#7)    │
                    │  (Proactive)   │
                    └────────────────┘
```

### Gemini Multi-Tier Fallback Chain

Instead of LangChain, we built a custom API wrapper that guarantees **100% uptime** on the free tier:

```
Request → gemini-3.1-flash-lite
              ↓ (429 rate limit?)
          gemini-2.5-flash-lite
              ↓ (429 rate limit?)
          gemini-2.5-flash ← Final fallback
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4, Shadcn UI |
| **Animation** | Framer Motion |
| **Database** | Supabase (Postgres + Auth + Storage + RLS) |
| **AI** | Google Gemini (`@google/genai`) — No LangChain |
| **Caching** | SWR (stale-while-revalidate) |
| **State** | `react-use` (useLocalStorage) for persistence |
| **Live Jobs** | Apify LinkedIn Scraper |
| **Gamification** | Custom XP/Streak engine + `react-confetti` |
| **Deployment** | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Gemini API Key](https://aistudio.google.com/apikey)
- (Optional) An [Apify](https://apify.com) token for live job data

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/z-lovejeet/career-coach.git
cd career-coach

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# 4. Set up the database
# Run the SQL in supabase-schema.sql in your Supabase SQL Editor

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
career-coach/
├── public/                    # Static assets (logo)
├── docs/                      # Project documentation (HTML)
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated app routes
│   │   │   ├── chat/          #   AI Chat Mentor page
│   │   │   ├── companies/     #   Company recommendations page
│   │   │   ├── dashboard/     #   Main dashboard
│   │   │   ├── interview/     #   Mock interview page
│   │   │   ├── onboarding/    #   Multi-step profile setup
│   │   │   │   └── steps/     #     StepBasicInfo, StepResume, StepSkills, etc.
│   │   │   ├── profile/       #   Profile + CV Analysis Report
│   │   │   ├── progress/      #   Progress tracking
│   │   │   ├── roadmap/       #   AI Roadmap generator
│   │   │   ├── tasks/         #   Daily task management
│   │   │   └── layout.tsx     #   App shell (sidebar, nav)
│   │   ├── api/               # Backend API routes
│   │   │   ├── alerts/        #   Proactive Alert Engine
│   │   │   ├── analyze/       #   Profile Analyzer Agent
│   │   │   ├── chat/          #   Chat Mentor Agent
│   │   │   ├── companies/     #   Company data
│   │   │   ├── dashboard/     #   Dashboard aggregation
│   │   │   ├── interview/     #   Interview Mentor Agent
│   │   │   ├── jobs/          #   Apify LinkedIn scraper
│   │   │   ├── onboarding/    #   Resume upload + AI extraction
│   │   │   ├── profile/       #   Profile CRUD
│   │   │   ├── roadmap/       #   Roadmap Architect Agent
│   │   │   ├── streak/        #   XP & Streak engine
│   │   │   └── tasks/         #   Task Planner Agent
│   │   ├── auth/              # Authentication pages
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Design system & tokens
│   ├── components/
│   │   └── ui/                # Shadcn UI primitives (18 components)
│   ├── lib/
│   │   ├── agents/            # AI agent implementations
│   │   │   ├── gemini.ts      #   Core Gemini wrapper + fallback chain
│   │   │   ├── analyzer.ts    #   Profile Analyzer logic
│   │   │   ├── chat.ts        #   Chat Mentor logic
│   │   │   ├── interview.ts   #   Interview Mentor logic
│   │   │   ├── planner.ts     #   Task Planner logic
│   │   │   └── recommendation.ts  # Recommender logic
│   │   ├── supabase/          # Supabase client utilities
│   │   └── utils.ts           # Shared utilities
│   ├── middleware.ts          # Auth middleware
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── supabase-schema.sql        # Database schema
├── .env.local.example         # Environment variable template
├── package.json
└── tsconfig.json
```

---

## Agents

### 1. Profile Analyzer Agent
**File:** `src/lib/agents/analyzer.ts` → **API:** `src/app/api/analyze/route.ts`  
Ingests PDF resume via Gemini multimodal, extracts skills with proficiency ratings, calculates a 0–100 readiness score, identifies strengths/weaknesses/missing skills.

### 2. Roadmap Architect Agent
**API:** `src/app/api/roadmap/route.ts`  
Takes dream company + timeline + available hours + focus areas from the user and generates a multi-phase, week-by-week study plan with real YouTube playlists and practice resources.

### 3. Interview Mentor Agent
**File:** `src/lib/agents/interview.ts` → **API:** `src/app/api/interview/`  
Conducts adaptive technical mock interviews. Evaluates answers in real-time, scores 1–10, and probes follow-ups for incorrect answers.

### 4. Chat Mentor Agent
**File:** `src/lib/agents/chat.ts` → **API:** `src/app/api/chat/route.ts`  
Context-heavy Markdown chat. Knows the student's profile, score, and weaknesses before a single message is sent.

### 5. Task Planner Agent
**File:** `src/lib/agents/planner.ts` → **API:** `src/app/api/tasks/generate/route.ts`  
Auto-generates daily practice tasks based on detected weaknesses and the current week's learning objectives.

### 6. Recommender Agent
**File:** `src/lib/agents/recommendation.ts` → **API:** `src/app/api/companies/route.ts`  
Compares the student's skills against real job requirements to suggest matching companies.

### 7. Proactive Alert Engine
**API:** `src/app/api/alerts/route.ts`  
Operates **autonomously**. Evaluates database state silently and triggers contextual interventions (e.g., "You haven't practiced DSA in 3 days") without user input.

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel's dashboard
4. Deploy!

### Environment Variables Required

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `APIFY_API_TOKEN` | Optional | Apify token for live LinkedIn jobs |
| `NEXT_PUBLIC_APP_URL` | Optional | App URL (defaults to localhost) |

---

## Documentation

Full technical documentation is available at `/docs/CareerAI-Documentation.html`. Open it directly in your browser for the complete reference.

---

## License

This project was built for a hackathon submission.

---

<p align="center">
  Built with ❤️ using Next.js, Supabase, and Google Gemini
</p>
