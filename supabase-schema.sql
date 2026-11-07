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

-- 9. Roadmaps table (persists multi-phase AI career plans)
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dream_company TEXT,
  target_role TEXT,
  timeline_months INT DEFAULT 6,
  content JSONB NOT NULL,
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
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

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

-- Roadmaps
CREATE POLICY "Users can view own roadmaps" ON roadmaps FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own roadmaps" ON roadmaps FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can delete own roadmaps" ON roadmaps FOR DELETE USING (auth.uid() = profile_id);

-- ==========================================
-- Performance Indexes (High speed lookups)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_analyses_profile_id ON analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_tasks_profile_id ON tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(profile_id, completed);
CREATE INDEX IF NOT EXISTS idx_interviews_profile_id ON interviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_profile_id ON chat_messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_alerts_profile_id ON alerts(profile_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_profile_id ON company_recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_progress_profile_id ON progress_snapshots(profile_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_profile_id ON roadmaps(profile_id);

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
-- Create secure storage bucket for resumes
-- (Private bucket - only authenticated owners can read/write)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policy: Users can upload ONLY into their own folder (auth.uid()/...)
CREATE POLICY "Users can upload own resume"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Users can read ONLY their own resumes
CREATE POLICY "Users can read own resume"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR auth.role() = 'service_role'
    )
  );

-- Storage policy: Users can delete their own resumes
CREATE POLICY "Users can delete own resume"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Serialize week creation for each candidate. Existing task history is preserved.
CREATE OR REPLACE FUNCTION public.save_weekly_tasks(
  p_analysis_id uuid,
  p_week_number integer,
  p_tasks jsonb
)
RETURNS SETOF public.tasks
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  candidate uuid := auth.uid();
BEGIN
  IF candidate IS NULL OR p_week_number IS NULL OR p_week_number < 1
    OR jsonb_typeof(p_tasks) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid task plan' USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(p_tasks) NOT BETWEEN 1 AND 8 OR NOT EXISTS (
    SELECT 1 FROM public.analyses WHERE id = p_analysis_id AND profile_id = candidate
  ) THEN
    RAISE EXCEPTION 'Invalid task plan or analysis' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('career-coach:weekly-tasks:' || candidate::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.tasks WHERE profile_id = candidate AND week_number = p_week_number
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
    INSERT INTO public.tasks (profile_id, analysis_id, title, description, category, difficulty, type, day_number, week_number, priority)
    SELECT candidate, p_analysis_id, task.title, task.description, task.category, task.difficulty, task.type,
      task.day_number, p_week_number, task.priority
    FROM jsonb_to_recordset(p_tasks) AS task(
      title text, description text, category text, difficulty text, type text, day_number integer, priority integer
    )
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.save_weekly_tasks(uuid, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_weekly_tasks(uuid, integer, jsonb) TO authenticated;


-- Apply before deploying the hardened auth, resume, and AI routes.
update storage.buckets
set public = false,
    file_size_limit = 4194304,
    allowed_mime_types = array['application/pdf']::text[]
where id = 'resumes';

-- Old guest sessions can retain valid access tokens until their expiry.
do $$
declare
  relation text;
begin
  foreach relation in array array[
    'profiles', 'analyses', 'company_recommendations', 'tasks', 'progress_snapshots',
    'interviews', 'chat_messages', 'alerts', 'roadmaps'
  ] loop
    execute format('drop policy if exists "Block legacy shared guest" on public.%I', relation);
    execute format(
      'create policy "Block legacy shared guest" on public.%I as restrictive for all to authenticated using (%s) with check (%s)',
      relation,
      $policy$ lower(coalesce(auth.jwt() ->> 'email', '')) <> 'guest.candidate@careerai.local' $policy$,
      $policy$ lower(coalesce(auth.jwt() ->> 'email', '')) <> 'guest.candidate@careerai.local' $policy$
    );
  end loop;
end;
$$;

drop policy if exists "Block legacy shared guest" on storage.objects;
create policy "Block legacy shared guest" on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'resumes' or lower(coalesce(auth.jwt() ->> 'email', '')) <> 'guest.candidate@careerai.local')
  with check (bucket_id <> 'resumes' or lower(coalesce(auth.jwt() ->> 'email', '')) <> 'guest.candidate@careerai.local');

create schema if not exists career_private;
revoke all on schema career_private from public, anon, authenticated;

create table if not exists career_private.ai_request_windows (
  action_name text not null,
  bucket text not null,
  window_start timestamptz not null,
  requests integer not null,
  primary key (action_name, bucket, window_start)
);
create index if not exists ai_request_windows_expiry_idx on career_private.ai_request_windows (window_start);

-- Consume one operation in the caller's hourly window and the daily guest budget.
-- The returned integer is the number of seconds until retry, or zero when allowed.
create or replace function public.consume_ai_quota(action_name text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  is_guest boolean := (auth.jwt() ->> 'is_anonymous') = 'true';
  current_time_value timestamptz := now();
  window_hour timestamptz := date_bin(interval '1 hour', current_time_value, 'epoch'::timestamptz);
  window_day timestamptz := date_bin(interval '1 day', current_time_value, 'epoch'::timestamptz);
  hourly_limit integer;
  guest_limit integer;
begin
  if actor is null or lower(coalesce(auth.jwt() ->> 'email', '')) = 'guest.candidate@careerai.local' then
    raise exception 'An active session is required' using errcode = '42501';
  end if;

  select limits.hourly, limits.guest_daily into hourly_limit, guest_limit
  from (values
    ('chat', 30, 250),
    ('jobs', 6, 25),
    ('roadmap', 4, 45),
    ('interview-start', 6, 60),
    ('interview-answer', 30, 300),
    ('tasks', 5, 50),
    ('analysis', 4, 40),
    ('resume', 4, 40),
    ('companies', 4, 40)
  ) as limits(action, hourly, guest_daily)
  where limits.action = consume_ai_quota.action_name;

  if hourly_limit is null then
    raise exception 'Invalid quota action' using errcode = '22023';
  end if;

  delete from career_private.ai_request_windows where window_start < window_day - interval '1 day';

  insert into career_private.ai_request_windows as usage
    values (consume_ai_quota.action_name, actor::text, window_hour, 1)
  on conflict on constraint ai_request_windows_pkey
  do update set requests = usage.requests + 1 where usage.requests < hourly_limit;
  if not found then
    return greatest(1, ceil(extract(epoch from window_hour + interval '1 hour' - current_time_value))::integer);
  end if;

  if is_guest then
    insert into career_private.ai_request_windows as usage
      values (consume_ai_quota.action_name, 'guests', window_day, 1)
    on conflict on constraint ai_request_windows_pkey
    do update set requests = usage.requests + 1 where usage.requests < guest_limit;
    if not found then
      return greatest(1, ceil(extract(epoch from window_day + interval '1 day' - current_time_value))::integer);
    end if;
  end if;

  return 0;
end;
$$;

revoke all on function public.consume_ai_quota(text) from public, anon;
grant execute on function public.consume_ai_quota(text) to authenticated;
