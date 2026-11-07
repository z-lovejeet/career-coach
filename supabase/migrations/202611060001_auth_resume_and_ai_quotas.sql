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
