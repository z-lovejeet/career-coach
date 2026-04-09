-- ==========================================
-- Agentic AI Career Coach - Database Schema
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  skill_ratings JSONB DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  education_level TEXT,
  field_of_study TEXT,
  experience_level TEXT DEFAULT 'fresher',
  github_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  projects JSONB DEFAULT '[]',
  preferred_role TEXT,
  preferred_locations TEXT[] DEFAULT '{}',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  extracted_skills JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  missing_skills JSONB DEFAULT '[]',
  readiness_score INT DEFAULT 0,
  summary TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Company recommendations table
CREATE TABLE IF NOT EXISTS company_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id),
  current_fit_companies JSONB DEFAULT '[]',
  target_companies JSONB DEFAULT '[]',
  skill_gaps JSONB DEFAULT '[]',
  roadmap_to_target JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  type TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  week_number INT,
  day_number INT,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Progress snapshots table
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  completion_rate FLOAT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  readiness_score INT DEFAULT 0,
  skill_progress JSONB DEFAULT '{}',
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  evaluations JSONB DEFAULT '[]',
  overall_score INT,
  feedback_summary TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Enable Row Level Security on ALL tables
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS Policies (users can only access own data)
-- ==========================================

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Analyses
CREATE POLICY "Users can view own analyses" ON analyses FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own analyses" ON analyses FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Company recommendations
CREATE POLICY "Users can view own recommendations" ON company_recommendations FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own recommendations" ON company_recommendations FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = profile_id);

-- Progress snapshots
CREATE POLICY "Users can view own progress" ON progress_snapshots FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own progress" ON progress_snapshots FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Interviews
CREATE POLICY "Users can view own interviews" ON interviews FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own interviews" ON interviews FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own interviews" ON interviews FOR UPDATE USING (auth.uid() = profile_id);

-- Chat messages
CREATE POLICY "Users can view own chat" ON chat_messages FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own chat" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Alerts
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid() = profile_id);

-- ==========================================
-- Auto-create profile on signup (trigger)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Create storage bucket for resumes
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');

-- Storage policy: public read
CREATE POLICY "Public can read resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');
