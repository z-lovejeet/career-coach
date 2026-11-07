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
