# Complete Project-Wide Frontend UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely redesign and rebuild the frontend UI/UX across every page, route, layout, and component in CareerAI to achieve a world-class, minimal, sophisticated, non-AI-slop product design standard (Linear / Stripe / Vercel caliber), preserving 100% of existing logic, APIs, and auth flows.

**Architecture:** Next.js 16 App Router with central Tailwind CSS v4 design tokens, refined component primitives, cohesive Obsidian & Titanium visual identity, negative letter-spaced editorial headers, tabular technical figures, and responsive cross-device layouts.

**Tech Stack:** Next.js 16.2.3, React 19, Tailwind CSS v4, Lucide Icons, SWR, Framer Motion, Supabase SSR.

**Spec:** Project prompt and design system guidelines for premium, minimal, coherent product design.

## Global Constraints
- Preserve all existing backend APIs, Route Handlers, Supabase schema, and Dual AI logic (Groq 120B + Gemini 3.8).
- Zero broken routes: all 33 static and dynamic routes must build cleanly (`npm run build`).
- Zero AI-slop visual patterns: no generic purple/cyan neon blobs, no excessive nested card bezels, no emoji icons in navigation, no bloated empty space.
- Consistent typography pairing: `Plus Jakarta Sans` for clean UI geometry + `JetBrains Mono` for all scores, telemetry, timestamps, code, and badges.
- WCAG AA contrast compliance across all text and interactive elements.
- Strict responsive fidelity tested at 375px mobile, 768px tablet, and 1280px+ desktop.

## Review Focus
1. Information hierarchy and container elimination: Replace heavy double-bezel cards with intentional whitespace, subtle tonal shifts, and 1px precision dividers.
2. Component consistency: Unified buttons, inputs, selects, tabs, dialogs, sheets, and badges with clear states (default, hover, active, focus, disabled, loading).
3. Data density & layout rhythm: Dashboard, Roadmap, Interview, Tasks, and Analytics pages must balance technical depth with breathable whitespace.
4. Navigation & App Shell: Redesigned desktop sidebar, breadcrumbs, topbar status telemetry, and mobile drawer with flawless micro-interactions.
5. Onboarding experience: Transform the 6-step candidate calibration wizard into an elegant, focused editorial flow.

---

### Task 1: Design Tokens & Core CSS Architecture Overhaul
**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Steps:**
- [ ] Define refined neutral palette (Deep Obsidian `#090A0F`, Slate Base `#0E111A`, Elevated Surface `#141824`, Border `#202534`) and authoritative Indigo/Electric Blue accent (`#3B82F6` / `#4F46E5`).
- [ ] Configure typography scales, line heights, letter-spacing tokens, and tabular font settings.
- [ ] Refactor custom utility classes (remove fake glowing blobs, establish `.surface-card`, `.divider-subtle`, `.badge-tech`, `.tabular-stat`).
- [ ] Run `npm run build` to verify CSS compilation.
- [ ] Commit changes.

---

### Task 2: Shared UI Component Library Modernization
**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/sheet.tsx`
- Modify: `src/components/ui/progress.tsx`
- Modify: `src/components/ui/skeleton.tsx`
- Modify: `src/components/ui/celebration-tracker.tsx`

**Steps:**
- [ ] Overhaul Button variants (default, secondary, outline, ghost, link) with tactile micro-interactions and loading state.
- [ ] Redesign Input and Textarea with crisp focus rings, high contrast placeholder, and subtle borders.
- [ ] Modernize Badge component with clean dot-indicators and technical mono typography.
- [ ] Refactor Card and Tabs components for minimal, uncluttered layouts.
- [ ] Polish Select, Dialog, Sheet, and Progress indicators.
- [ ] Verify TypeScript types and build passes.
- [ ] Commit changes.

---

### Task 3: Global Application Shell & Navigation Redesign
**Files:**
- Modify: `src/app/(app)/layout.tsx`

**Steps:**
- [ ] Redesign desktop fixed sidebar with refined brand lockup, clean navigation links, active indicator pills, and candidate status.
- [ ] Modernize top header bar with breadcrumb tracking, live AI engine status, streak counter, and user profile avatar dropdown.
- [ ] Overhaul mobile drawer navigation (`SheetContent`) for seamless small-screen touch navigation.
- [ ] Verify navigation across all routes.
- [ ] Commit changes.

---

### Task 4: Landing Page (`/`) Complete Re-Crafting
**Files:**
- Modify: `src/app/page.tsx`

**Steps:**
- [ ] Redesign Hero section with asymmetrical editorial composition, authoritative typography, and 1-click guest access.
- [ ] Modernize Interactive Telemetry Cockpit (Socratic, Rubric, Radar tabs) with real-time feedback.
- [ ] Rebuild Multi-Agent Architecture showcase with refined technical bento grid.
- [ ] Redesign Placement Protocol sequence, hiring bar alignment, and global footer.
- [ ] Verify responsive scaling on mobile and desktop.
- [ ] Commit changes.

---

### Task 5: Authentication Hub (`/auth`) Polish & Flow Refinement
**Files:**
- Modify: `src/app/auth/page.tsx`

**Steps:**
- [ ] Refine the 1-Click Instant Guest Access card with premium gradient accent.
- [ ] Polish tactile segmented tab switcher for Sign In vs Create Account.
- [ ] Redesign Google OAuth button and credentials form with inline diagnostics and instant feedback.
- [ ] Verify both Guest and Email login work seamlessly.
- [ ] Commit changes.

---

### Task 6: Executive Command Center (`/dashboard`) Redesign
**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Steps:**
- [ ] Redesign Header with candidate greeting, active roadmap sprint badge, and quick actions.
- [ ] Rebuild Placement Gauge with elegant SVG stroke animation and nuanced milestone markers.
- [ ] Overhaul KPI Stat Tiles with tabular figures, delta indicators, and subtle surfaces.
- [ ] Redesign Proactive Mentor Telemetry alert banner and Action Center recommendations.
- [ ] Polish Recent Practice tasks list with interactive toggles and direct practice links.
- [ ] Redesign Company Matchmaker radar preview.
- [ ] Commit changes.

---

### Task 7: Candidate Profile Dossier (`/profile`) Redesign
**Files:**
- Modify: `src/app/(app)/profile/page.tsx`

**Steps:**
- [ ] Redesign candidate header with profile status, contact metadata, and target role badge.
- [ ] Rebuild Resume PDF ingestion zone with drag-and-drop feedback, parsing progress, and Gemini 3.8 status.
- [ ] Overhaul Skill Taxonomy matrix with rating bars and proficiency categories.
- [ ] Redesign Strengths, Weaknesses, and Skill Gaps analysis cards with actionable mitigation advice.
- [ ] Polish engineering projects list and social handle links.
- [ ] Commit changes.

---

### Task 8: Daily Practice Hub (`/tasks`) Redesign
**Files:**
- Modify: `src/app/(app)/tasks/page.tsx`

**Steps:**
- [ ] Redesign page header with weekly sprint summary and Groq 120B task generator trigger.
- [ ] Rebuild category filter bar (`DSA`, `Web Dev`, `System Design`, `Soft Skills`, `Project`) with clean segmented pills.
- [ ] Overhaul Task cards with difficulty tags, due dates, interactive check state, and code screen launcher.
- [ ] Polish empty states and loading skeletons.
- [ ] Commit changes.

---

### Task 9: Company Matchmaker & Market Radar (`/companies`) Redesign
**Files:**
- Modify: `src/app/(app)/companies/page.tsx`

**Steps:**
- [ ] Redesign Dual-Mode Switcher: AI Placement Matchmaker vs Live LinkedIn Market Radar.
- [ ] Rebuild Company Match cards (Stripe, Google, Uber, Vercel, Netflix) with fit score badges, hiring bar tier, matching skills, and gap analysis.
- [ ] Redesign Live LinkedIn job feed with real-time compensation tags, location, and apply links.
- [ ] Polish search and filtering controls.
- [ ] Commit changes.

---

### Task 10: Dynamic Prep Roadmap (`/roadmap`) Redesign
**Files:**
- Modify: `src/app/(app)/roadmap/page.tsx`

**Steps:**
- [ ] Redesign roadmap overview card with target readiness curve, feasibility rating, and sprint timeline.
- [ ] Rebuild Phase & Week milestone timeline with collapsible weeks and daily theory/practice breakdown.
- [ ] Overhaul curated study resource cards with video, documentation, and practice problem badges.
- [ ] Redesign interview prep targets (DSA problem count, system design topics).
- [ ] Commit changes.

---

### Task 11: Socratic Mock Interview Suite (`/interview`) Redesign
**Files:**
- Modify: `src/app/(app)/interview/page.tsx`

**Steps:**
- [ ] Redesign interview session setup (topic selector, difficulty level, rubric preview).
- [ ] Rebuild active interview terminal cockpit with question display, code/text answer input, and timer.
- [ ] Overhaul real-time AI rubric feedback card with score breakdown, algorithmic complexity critique, and improvement tips.
- [ ] Redesign historical interview score log.
- [ ] Commit changes.

---

### Task 12: AI Mentor Socratic Chat (`/chat`) Redesign
**Files:**
- Modify: `src/app/(app)/chat/page.tsx`

**Steps:**
- [ ] Redesign chat workspace with clean conversation history, model telemetry badge, and clear context header.
- [ ] Rebuild message bubbles with high-contrast typography, syntax-highlighted code blocks, and 1-click copy.
- [ ] Redesign chat input bar with auto-expanding textarea, keyboard shortcuts, and quick prompt suggestions.
- [ ] Polish streaming/thinking loader states.
- [ ] Commit changes.

---

### Task 13: Progress Analytics & Mastery Telemetry (`/progress`) Redesign
**Files:**
- Modify: `src/app/(app)/progress/page.tsx`

**Steps:**
- [ ] Redesign executive metrics strip (Current Streak, Level XP, Tasks Completed, Interview Score).
- [ ] Rebuild Activity Heatmap calendar with clean monochromatic intensity tiers.
- [ ] Overhaul category mastery breakdown bars and achievement badge showcase.
- [ ] Commit changes.

---

### Task 14: Candidate Calibration Onboarding Flow (`/onboarding`) Redesign
**Files:**
- Modify: `src/app/(app)/onboarding/page.tsx`
- Modify: `src/app/(app)/onboarding/steps/StepBasicInfo.tsx`
- Modify: `src/app/(app)/onboarding/steps/StepResume.tsx`
- Modify: `src/app/(app)/onboarding/steps/StepSkills.tsx`
- Modify: `src/app/(app)/onboarding/steps/StepProjects.tsx`
- Modify: `src/app/(app)/onboarding/steps/StepGoals.tsx`
- Modify: `src/app/(app)/onboarding/steps/StepLinks.tsx`

**Steps:**
- [ ] Redesign 6-step progress header with step indicators, title, and back/forward navigation.
- [ ] Overhaul each individual step with clean form inputs, pill selectors, and resume upload dropzone.
- [ ] Polish completion transition to `/dashboard`.
- [ ] Commit changes.

---

### Task 15: Cross-Device Verification, Visual QA & Final Polish
**Files:**
- Comprehensive audit of all screens

**Steps:**
- [ ] Run full Next.js production build (`npm run build`).
- [ ] Test mobile, tablet, and desktop views via headless Chrome.
- [ ] Verify all interactive flows (Guest login, email login, task toggle, chat prompt, interview submit).
- [ ] Check for zero console errors, zero layout shifts, and WCAG AA contrast.
- [ ] Commit and push all changes.
