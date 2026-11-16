-- CareerCompass schema (replaces the CareerAI hackathon schema).
-- Old tables are moved to the `legacy` schema, not dropped, so no data is lost.

-- ─── 0. Retire the old schema ───────────────────────────────────────────
create schema if not exists legacy;
revoke all on schema legacy from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['analyses','company_recommendations','tasks','progress_snapshots',
                           'interviews','chat_messages','alerts','roadmaps','profiles'] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I set schema legacy', t);
    end if;
  end loop;
end $$;

drop function if exists public.save_weekly_tasks(uuid, integer, jsonb);
drop function if exists public.consume_ai_quota(text);

-- ─── 1. Helpers ─────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─── 2. Profiles (career data only — no phone / email) ──────────────────
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  headline            text,
  education           jsonb not null default '{}'::jsonb,   -- degree, branch, institution, year, cgpa
  academics           jsonb not null default '{}'::jsonb,   -- strong / weak subjects
  skills              jsonb not null default '[]'::jsonb,   -- [{name, level 1-5, category}]
  projects            jsonb not null default '[]'::jsonb,
  experience          jsonb not null default '[]'::jsonb,
  certifications      jsonb not null default '[]'::jsonb,
  achievements        jsonb not null default '[]'::jsonb,
  interests           jsonb not null default '{}'::jsonb,   -- riasec scores, quiz answers, areas
  goals               jsonb not null default '{}'::jsonb,   -- roles, industries, locations, hours, path
  onet_vector         jsonb,                                -- 75-dim O*NET feature vector
  analysis            jsonb,                                -- profile analyst output
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for users who signed up before this migration
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', '')
from auth.users
on conflict (id) do nothing;

-- ─── 3. Career matches (ML output) ──────────────────────────────────────
create table public.career_matches (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  matches       jsonb not null,
  families      jsonb not null,
  model_version text not null,
  created_at    timestamptz not null default now()
);
create index on public.career_matches (profile_id, created_at desc);

-- ─── 4. Roadmaps ────────────────────────────────────────────────────────
create table public.roadmaps (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  target      jsonb not null,                 -- {code, title, family}
  settings    jsonb not null default '{}'::jsonb,
  graph       jsonb not null,                 -- phases, nodes, edges
  trace       jsonb not null default '[]'::jsonb,
  version     integer not null default 1,
  status      text not null default 'active' check (status in ('active', 'archived')),
  is_sample   boolean not null default false,
  sample_persona jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.roadmaps (profile_id, updated_at desc);
create index on public.roadmaps (is_sample) where is_sample;
create trigger roadmaps_touch before update on public.roadmaps
  for each row execute function public.touch_updated_at();

create table public.roadmap_revisions (
  id          uuid primary key default gen_random_uuid(),
  roadmap_id  uuid not null references public.roadmaps(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  version     integer not null,
  graph       jsonb not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index on public.roadmap_revisions (roadmap_id, version desc);

-- ─── 5. Practice ────────────────────────────────────────────────────────
create table public.practice_questions (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  topic        text not null,
  difficulty   text not null check (difficulty in ('easy', 'medium', 'hard')),
  question     text not null,
  options      jsonb not null,
  answer       integer not null,
  explanation  text not null,
  source_model text,
  created_at   timestamptz not null default now()
);
create unique index practice_questions_unique on public.practice_questions (subject, md5(lower(question)));
create index on public.practice_questions (subject, topic, difficulty);

create table public.practice_sessions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  subject      text not null,
  topic        text not null,
  difficulty   text not null,
  question_ids uuid[] not null,
  responses    jsonb not null default '[]'::jsonb,   -- [{questionId, chosen, correct, ms}]
  correct      integer not null default 0,
  total        integer not null,
  status       text not null default 'active' check (status in ('active', 'completed')),
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index on public.practice_sessions (profile_id, started_at desc);

-- ─── 6. Interviews ──────────────────────────────────────────────────────
create table public.interviews (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  config       jsonb not null,                  -- role, subject, company, difficulty, type, length
  transcript   jsonb not null default '[]'::jsonb,
  state        jsonb not null default '{}'::jsonb,
  report       jsonb,
  score        integer,
  status       text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index on public.interviews (profile_id, created_at desc);

-- ─── 7. Mentor ──────────────────────────────────────────────────────────
create table public.mentor_threads (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null default 'New conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.mentor_threads (profile_id, updated_at desc);
create trigger mentor_threads_touch before update on public.mentor_threads
  for each row execute function public.touch_updated_at();

create table public.mentor_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.mentor_threads(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  meta        jsonb not null default '{}'::jsonb,   -- tool calls, model
  created_at  timestamptz not null default now()
);
create index on public.mentor_messages (thread_id, created_at);

-- ─── 8. Company suggestions + activity log ──────────────────────────────
create table public.company_suggestions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  target      text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index on public.company_suggestions (profile_id, created_at desc);

create table public.activity (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  xp          integer not null default 0,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on public.activity (profile_id, created_at desc);

-- ─── 9. Row-level security ──────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.career_matches      enable row level security;
alter table public.roadmaps            enable row level security;
alter table public.roadmap_revisions   enable row level security;
alter table public.practice_questions  enable row level security;
alter table public.practice_sessions   enable row level security;
alter table public.interviews          enable row level security;
alter table public.mentor_threads      enable row level security;
alter table public.mentor_messages     enable row level security;
alter table public.company_suggestions enable row level security;
alter table public.activity            enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['career_matches','roadmap_revisions','practice_sessions','interviews',
                           'mentor_threads','mentor_messages','company_suggestions'] loop
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id)', t);
  end loop;
end $$;

create policy "own roadmaps" on public.roadmaps for all to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "sample roadmaps are public" on public.roadmaps for select to anon, authenticated
  using (is_sample);

-- Shared question bank: readable by signed-in users, written only by the server.
create policy "read question bank" on public.practice_questions for select to authenticated using (true);
-- Activity (XP) is written only by the server so it cannot be forged from the browser.
create policy "read own activity" on public.activity for select to authenticated
  using ((select auth.uid()) = profile_id);

-- ─── 10. Private: AI cache, Groq rate limiter, per-user quota ───────────
create schema if not exists cc_private;
revoke all on schema cc_private from public, anon, authenticated;

create table if not exists cc_private.ai_cache (
  key        text primary key,
  value      jsonb not null,
  expires_at timestamptz not null
);
create index if not exists ai_cache_expiry on cc_private.ai_cache (expires_at);

create table if not exists cc_private.groq_usage (
  model        text not null,
  window_kind  text not null check (window_kind in ('minute', 'day')),
  window_start timestamptz not null,
  requests     integer not null default 0,
  tokens       integer not null default 0,
  primary key (model, window_kind, window_start)
);

create table if not exists cc_private.groq_cooldowns (
  model  text primary key,
  until  timestamptz not null,
  reason text
);

create table if not exists cc_private.user_quota (
  profile_id   uuid not null,
  action       text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (profile_id, action, window_start)
);

-- Reserve capacity on a model. Returns 0 when allowed, otherwise seconds until it may be retried.
create or replace function public.cc_groq_reserve(
  p_model text, p_tokens integer, p_rpm integer, p_rpd integer, p_tpm integer, p_tpd integer
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_now    timestamptz := now();
  v_minute timestamptz := date_trunc('minute', v_now);
  v_day    timestamptz := date_trunc('day', v_now);
  v_until  timestamptz;
  m_req int; m_tok int; d_req int; d_tok int;
begin
  select until into v_until from cc_private.groq_cooldowns where model = p_model;
  if v_until is not null and v_until > v_now then
    return greatest(1, ceil(extract(epoch from v_until - v_now))::int);
  end if;

  insert into cc_private.groq_usage (model, window_kind, window_start) values (p_model, 'minute', v_minute)
    on conflict do nothing;
  insert into cc_private.groq_usage (model, window_kind, window_start) values (p_model, 'day', v_day)
    on conflict do nothing;

  select requests, tokens into m_req, m_tok from cc_private.groq_usage
    where model = p_model and window_kind = 'minute' and window_start = v_minute for update;
  select requests, tokens into d_req, d_tok from cc_private.groq_usage
    where model = p_model and window_kind = 'day' and window_start = v_day for update;

  if d_req + 1 > p_rpd or d_tok + p_tokens > p_tpd then
    return greatest(1, ceil(extract(epoch from v_day + interval '1 day' - v_now))::int);
  end if;
  if m_req + 1 > p_rpm or m_tok + p_tokens > p_tpm then
    return greatest(1, ceil(extract(epoch from v_minute + interval '1 minute' - v_now))::int);
  end if;

  update cc_private.groq_usage set requests = requests + 1, tokens = tokens + p_tokens
    where model = p_model and ((window_kind = 'minute' and window_start = v_minute)
                            or (window_kind = 'day' and window_start = v_day));

  delete from cc_private.groq_usage where window_start < v_day - interval '2 days';
  return 0;
end $$;

-- Correct the reserved token estimate once the real usage is known.
create or replace function public.cc_groq_settle(p_model text, p_delta integer)
returns void language sql security definer set search_path = '' as $$
  update cc_private.groq_usage set tokens = greatest(0, tokens + p_delta)
  where model = p_model and (
    (window_kind = 'minute' and window_start = date_trunc('minute', now())) or
    (window_kind = 'day' and window_start = date_trunc('day', now())));
$$;

create or replace function public.cc_groq_cooldown(p_model text, p_seconds integer, p_reason text)
returns void language sql security definer set search_path = '' as $$
  insert into cc_private.groq_cooldowns (model, until, reason)
  values (p_model, now() + make_interval(secs => p_seconds), p_reason)
  on conflict (model) do update set until = excluded.until, reason = excluded.reason;
$$;

create or replace function public.cc_groq_status()
returns jsonb language sql security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(models.model, jsonb_build_object(
    'minuteRequests', coalesce(m.requests, 0), 'minuteTokens', coalesce(m.tokens, 0),
    'dayRequests', coalesce(d.requests, 0), 'dayTokens', coalesce(d.tokens, 0),
    'cooldownUntil', c.until)), '{}'::jsonb)
  from (select distinct model from cc_private.groq_usage
        union select model from cc_private.groq_cooldowns) models
  left join cc_private.groq_usage m on m.model = models.model and m.window_kind = 'minute' and m.window_start = date_trunc('minute', now())
  left join cc_private.groq_usage d on d.model = models.model and d.window_kind = 'day' and d.window_start = date_trunc('day', now())
  left join cc_private.groq_cooldowns c on c.model = models.model and c.until > now();
$$;

create or replace function public.cc_cache_get(p_key text)
returns jsonb language sql security definer set search_path = '' as $$
  select value from cc_private.ai_cache where key = p_key and expires_at > now();
$$;

create or replace function public.cc_cache_set(p_key text, p_value jsonb, p_ttl_seconds integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into cc_private.ai_cache (key, value, expires_at)
  values (p_key, p_value, now() + make_interval(secs => p_ttl_seconds))
  on conflict (key) do update set value = excluded.value, expires_at = excluded.expires_at;
  delete from cc_private.ai_cache where expires_at < now() - interval '1 day';
end $$;

-- Per-user hourly quota. Fails closed: unknown caller raises.
create or replace function public.cc_consume_quota(p_action text, p_limit integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_hour timestamptz := date_trunc('hour', now());
  v_count int;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  insert into cc_private.user_quota as q (profile_id, action, window_start, count)
  values (v_uid, p_action, v_hour, 1)
  on conflict (profile_id, action, window_start) do update set count = q.count + 1
  returning count into v_count;
  if v_count > p_limit then
    return greatest(1, ceil(extract(epoch from v_hour + interval '1 hour' - now()))::int);
  end if;
  delete from cc_private.user_quota where window_start < v_hour - interval '1 day';
  return 0;
end $$;

revoke all on function public.cc_groq_reserve(text, integer, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.cc_groq_settle(text, integer) from public, anon, authenticated;
revoke all on function public.cc_groq_cooldown(text, integer, text) from public, anon, authenticated;
revoke all on function public.cc_groq_status() from public, anon, authenticated;
revoke all on function public.cc_cache_get(text) from public, anon, authenticated;
revoke all on function public.cc_cache_set(text, jsonb, integer) from public, anon, authenticated;
grant execute on function public.cc_groq_reserve(text, integer, integer, integer, integer, integer) to service_role;
grant execute on function public.cc_groq_settle(text, integer) to service_role;
grant execute on function public.cc_groq_cooldown(text, integer, text) to service_role;
grant execute on function public.cc_groq_status() to service_role;
grant execute on function public.cc_cache_get(text) to service_role;
grant execute on function public.cc_cache_set(text, jsonb, integer) to service_role;
revoke all on function public.cc_consume_quota(text, integer) from public, anon;
grant execute on function public.cc_consume_quota(text, integer) to authenticated;
