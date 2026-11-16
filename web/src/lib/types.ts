// Shared domain types (used by server and client).

export type RiasecType = "Realistic" | "Investigative" | "Artistic" | "Social" | "Enterprising" | "Conventional";

export interface Education {
  level: string;            // e.g. "Undergraduate"
  degree: string;           // e.g. "B.Tech"
  branch: string;           // e.g. "Computer Science (AI & ML)"
  institution: string;
  currentYear: string;      // e.g. "3rd year" or "Graduated"
  graduationYear: string;
  cgpa: string;
}

export interface Academics {
  strongSubjects: string[];
  weakSubjects: string[];
  coursework: string[];
}

export interface Skill {
  name: string;
  level: number;            // 1–5
  category: "technical" | "tool" | "soft" | "language";
}

export interface Project { title: string; description: string; tech: string[]; link: string }
export interface Experience { role: string; organization: string; type: string; duration: string; description: string }
export interface Certification { name: string; issuer: string; year: string }

export interface Interests {
  riasec: Partial<Record<RiasecType, number>>;   // 0–1
  answers: Record<string, number>;               // quiz item id → 1–5
  areas: string[];
}

export type CareerPath = "job" | "higher_studies" | "entrepreneurship" | "unsure";

export interface Goals {
  targetRoles: string[];
  dreamCompanies: string[];
  industries: string[];
  locations: string[];
  path: CareerPath;
  hoursPerWeek: number;
  timelineMonths: number;
  notes: string;
}

export interface ProfileAnalysis {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  model: string;
  analyzedAt: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  headline: string | null;
  education: Partial<Education>;
  academics: Partial<Academics>;
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  certifications: Certification[];
  achievements: string[];
  interests: Partial<Interests>;
  goals: Partial<Goals>;
  onet_vector: Record<string, number> | null;
  analysis: ProfileAnalysis | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

// ── Career matching ─────────────────────────────────────────────
export interface CareerMatch {
  code: string;
  title: string;
  family: string;
  match: number;            // 0–100
  jobZone: number;
  description: string;
  topSkills: string[];
}

export interface FamilyFit { code: string; name: string; probability: number }

// ── Roadmap graph ───────────────────────────────────────────────
export type NodeKind = "course" | "skill" | "project" | "milestone" | "career";
export type NodeStatus = "todo" | "doing" | "done";

export interface CourseLink { label: string; url: string; provider: string }

export interface RoadmapNode {
  id: string;
  kind: NodeKind;
  title: string;
  description: string;
  phaseId: string;
  weeks: number;
  status: NodeStatus;
  skillIds?: string[];        // O*NET feature ids this node builds
  links?: CourseLink[];
  deliverable?: string;
  why?: string;
  custom?: boolean;           // added by the student
}

export interface RoadmapEdge { from: string; to: string }

export interface RoadmapPhase {
  id: string;
  title: string;
  goal: string;
  startWeek: number;
  weeks: number;
  milestone: string;
}

export interface RoadmapGraph {
  summary: string;
  totalWeeks: number;
  hoursPerWeek: number;
  phases: RoadmapPhase[];
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  gaps: SkillGap[];
  checks: { label: string; passed: boolean; detail: string }[];
}

export interface SkillGap {
  id: string;
  name: string;
  required: number;          // 0–1
  current: number;           // 0–1
  importance: number;        // 0–1
  gap: number;               // weighted
}

export interface TraceStep {
  id: string;
  agent: string;
  title: string;
  status: "running" | "done" | "error" | "skipped";
  summary?: string;
  detail?: unknown;
  model?: string;
  cached?: boolean;
  ms?: number;
  tokens?: number;
}

export interface Roadmap {
  id: string;
  profile_id: string;
  title: string;
  target: { code: string; title: string; family: string };
  settings: { hoursPerWeek: number; timelineMonths: number; focus?: string; style?: string };
  graph: RoadmapGraph;
  trace: TraceStep[];
  version: number;
  status: "active" | "archived";
  is_sample: boolean;
  sample_persona: { name: string; background: string } | null;
  created_at: string;
  updated_at: string;
}
