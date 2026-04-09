// ==========================================
// Database Types (matching Supabase schema)
// ==========================================

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  skill_ratings: Record<string, number>;
  goals: string[];
  education_level: string | null;
  field_of_study: string | null;
  experience_level: string;
  github_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  projects: Project[];
  preferred_role: string | null;
  preferred_locations: string[];
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  name: string;
  tech: string[];
  description: string;
  url?: string;
}

export interface Analysis {
  id: string;
  profile_id: string;
  extracted_skills: ExtractedSkill[];
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  missing_skills: MissingSkill[];
  readiness_score: number;
  summary: string;
  raw_response: unknown;
  created_at: string;
}

export interface ExtractedSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
}

export interface StrengthWeakness {
  skill: string;
  reason: string;
}

export interface MissingSkill {
  skill: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export interface CompanyRecommendation {
  id: string;
  profile_id: string;
  analysis_id: string;
  current_fit_companies: CompanyMatch[];
  target_companies: CompanyMatch[];
  skill_gaps: SkillGap[];
  roadmap_to_target: RoadmapMonth[];
  created_at: string;
}

export interface CompanyMatch {
  name: string;
  role: string;
  match_score: number;
  matching_skills?: string[];
  required_skills?: string[];
  gap_skills?: string[];
  reason: string;
  estimated_timeline?: string;
}

export interface SkillGap {
  skill: string;
  current_level: string;
  required_level: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RoadmapMonth {
  month: number;
  focus: string;
  tasks: string[];
}

export interface Task {
  id: string;
  profile_id: string;
  analysis_id: string | null;
  title: string;
  description: string | null;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  type: TaskType;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  week_number: number | null;
  day_number: number | null;
  priority: number;
  created_at: string;
}

export type TaskCategory = 'dsa' | 'web_dev' | 'system_design' | 'soft_skills' | 'project' | 'other';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskType = 'daily' | 'weekly' | 'milestone';

export interface ProgressSnapshot {
  id: string;
  profile_id: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  readiness_score: number;
  skill_progress: Record<string, number>;
  snapshot_date: string;
  created_at: string;
}

export interface Interview {
  id: string;
  profile_id: string;
  topic: string;
  difficulty: TaskDifficulty;
  questions: InterviewQuestion[];
  answers: string[];
  evaluations: InterviewEvaluation[];
  overall_score: number | null;
  feedback_summary: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  type: 'conceptual' | 'coding' | 'behavioral' | 'system_design';
  expected_topics: string[];
}

export interface InterviewEvaluation {
  question_id: number;
  score: number;
  max_score: number;
  feedback: string;
  topics_covered: string[];
  topics_missed: string[];
  improvement_tip: string;
}

export interface ChatMessage {
  id: string;
  profile_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Alert {
  id: string;
  profile_id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type AlertType = 'missed_task' | 'deadline' | 'performance' | 'milestone' | 'tip';
export type AlertSeverity = 'info' | 'warning' | 'critical';

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ==========================================
// Agent Input/Output Types
// ==========================================

export interface AnalyzerInput {
  skills: string[];
  skill_ratings: Record<string, number>;
  projects: Project[];
  education: string;
  experience: string;
  goals: string[];
  resume_text?: string;
}

export interface AnalyzerOutput {
  extracted_skills: ExtractedSkill[];
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  missing_skills: MissingSkill[];
  readiness_score: number;
  summary: string;
}

export interface RecommendationInput {
  analysis: AnalyzerOutput;
  goals: string[];
  preferred_locations: string[];
  experience_level: string;
}

export interface RecommendationOutput {
  current_fit_companies: CompanyMatch[];
  target_companies: CompanyMatch[];
  skill_gaps: SkillGap[];
  roadmap_to_target: RoadmapMonth[];
}

export interface PlannerInput {
  analysis: AnalyzerOutput;
  recommendations: RecommendationOutput;
  goals: string[];
  available_hours_per_day: number;
  current_week: number;
}

export interface PlannerOutput {
  weekly_plan: {
    week_number: number;
    theme: string;
    tasks: Array<{
      title: string;
      description: string;
      category: TaskCategory;
      difficulty: TaskDifficulty;
      type: TaskType;
      day_number: number;
      priority: number;
      estimated_minutes: number;
    }>;
  };
}

export interface DecisionInput {
  tasks_last_7_days: Task[];
  completion_rate: number;
  streak: number;
  current_readiness_score: number;
  original_plan_difficulty: string;
}

export interface DecisionOutput {
  adjustments: Array<{
    type: string;
    reason: string;
    action: string;
    tasks_to_reschedule?: string[];
  }>;
  alerts: Array<{
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
  }>;
  new_tasks: Array<{
    title: string;
    description: string;
    category: TaskCategory;
    difficulty: TaskDifficulty;
    type: TaskType;
    day_number: number;
    priority: number;
  }>;
}

export interface InterviewGenerateInput {
  topic: string;
  difficulty: TaskDifficulty;
  num_questions: number;
  student_level: string;
}

export interface InterviewEvaluateInput {
  question: string;
  answer: string;
  expected_topics: string[];
}

export interface ChatInput {
  message: string;
  chat_history: Array<{ role: string; content: string }>;
  student_context: {
    skills: string[];
    readiness_score: number;
    goals: string[];
    current_focus: string;
  };
}

export interface ChatOutput {
  response: string;
  suggested_actions?: Array<{
    text: string;
    action: string;
  }>;
}

// ==========================================
// UI Component Types
// ==========================================

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface OnboardingFormData {
  full_name: string;
  email: string;
  phone: string;
  education_level: string;
  field_of_study: string;
  experience_level: string;
  skills: string[];
  skill_ratings: Record<string, number>;
  projects: Project[];
  goals: string[];
  preferred_role: string;
  preferred_locations: string[];
  github_url: string;
  portfolio_url: string;
  linkedin_url: string;
  resume_file: File | null;
}
