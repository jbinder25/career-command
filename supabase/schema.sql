-- =====================================================================================================
-- Career workspace: complete schema for a NEW Supabase project.
-- Run this whole file once (Supabase SQL editor, or apply_migration). It represents the final state of
-- every migration in supabase/migrations/. Existing projects should apply migrations instead.
--
-- AFTER running it, and BEFORE the owner's first sign-in, insert the single config row:
--
--   insert into private.job_agent_config (secret_sha256, owner_email)
--   values (encode(extensions.digest('<JOB_AGENT_SECRET>', 'sha256'), 'hex'), '<owner email>');
--
-- <JOB_AGENT_SECRET> is the shared secret the job scan uses (keep the plain value in your app env vars);
-- only its SHA-256 is stored. <owner email> is the one account allowed to sign up and read any data.
-- Sign-ups are blocked until this row exists (trigger only_owner_signup on auth.users).
-- =====================================================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

-- One-row config: job agent secret hash + the owner's email. Never exposed through the API.
create table private.job_agent_config (
  id boolean primary key default true check (id),
  secret_sha256 text not null,
  owner_email text not null
);
-- No policies on purpose: anon/authenticated have no access. Only the security definer functions
-- (owned by postgres, the table owner, which bypasses RLS) and service roles read this table.
alter table private.job_agent_config enable row level security;

-- ----------------------------------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null,
  title text not null,
  stage text not null default 'Prospect',
  source text,
  recruiter text,
  contact text,
  location text,
  compensation text,
  fit text,
  interest text,
  posting_url text,
  last_contact date,
  next_action text,
  next_date date,
  notes text,
  action_owner text not null default 'Unassigned' check (action_owner in ('Me','Company','Unassigned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  name text not null,
  role text,
  email text,
  profile_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  kind text not null,
  occurred_at timestamptz not null default now(),
  summary text not null,
  details text,
  direction text,
  channel text,
  stage_at_time text,
  status text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('resume','cover_letter','other')),
  description text,
  created_at timestamptz not null default now()
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  storage_path text not null,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  created_at timestamptz not null default now(),
  unique (document_id, version_number),
  unique (storage_path)
);

create table public.job_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  purpose text not null default 'prepared',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (job_id, document_version_id, purpose)
);

create table public.interview_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  interviewer_name text,
  interviewer_role text,
  round_type text not null default 'Team interview',
  status text not null default 'Scheduling',
  scheduled_at timestamptz,
  duration_minutes integer,
  meeting_url text,
  scheduling_url text,
  focus text,
  prep_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  lead_key text not null unique,
  company text not null,
  title text not null,
  location text,
  url text not null,
  source text not null,
  tier int,
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  closed_at timestamptz,
  comp_text text,
  base_min int,
  base_max int,
  description text,
  status text not null default 'pending'
    check (status in ('filtered','pending','scored','review','accepted','rejected','error')),
  filter_reason text,
  score int,
  evaluation jsonb,
  attempts int not null default 0,
  surfaced_at timestamptz,
  decided_at timestamptz,
  reject_reason text,
  job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_sources (
  company text primary key,
  board text,
  status text not null default 'unresolved',
  jobs_seen int,
  last_checked_at timestamptz,
  last_error text
);

create table public.job_agent_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb
);

-- ----------------------------------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------------------------------
create index on public.jobs (user_id, stage);
create index on public.activities (user_id, job_id, occurred_at desc);
create index on public.contacts (user_id, job_id);
create index on public.documents (user_id, kind);
create index on public.document_versions (user_id, document_id);
create index on public.job_documents (user_id, job_id);
create index interview_rounds_job_idx on public.interview_rounds (job_id);
create index job_leads_status_idx on public.job_leads (status, first_seen_at desc);

-- ----------------------------------------------------------------------------------------------------
-- Owner check (used by the restrictive policies below)
-- ----------------------------------------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = (select lower(c.owner_email) from private.job_agent_config c limit 1),
    false
  );
$$;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- ----------------------------------------------------------------------------------------------------
-- Row level security
-- ----------------------------------------------------------------------------------------------------
alter table public.jobs enable row level security;
alter table public.contacts enable row level security;
alter table public.activities enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.job_documents enable row level security;
alter table public.interview_rounds enable row level security;
alter table public.job_leads enable row level security;
alter table public.job_sources enable row level security;
alter table public.job_agent_runs enable row level security;

-- Per-user policies (rows belong to the signed-in user).
do $$
declare t text;
begin
  foreach t in array array['jobs','contacts','activities','documents','document_versions','job_documents'] loop
    execute format('create policy "own select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "own insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

create policy "owner select" on public.interview_rounds for select to authenticated
  using (user_id = (select auth.uid()));
create policy "owner insert" on public.interview_rounds for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.jobs j where j.id = job_id and j.user_id = (select auth.uid())));
create policy "owner update" on public.interview_rounds for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.jobs j where j.id = job_id and j.user_id = (select auth.uid())));
create policy "owner delete" on public.interview_rounds for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "own select" on public.job_leads for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own update" on public.job_leads for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Restrictive owner-only policies (these AND with the policies above).
drop policy if exists "approved email only" on public.jobs;
create policy "approved email only" on public.jobs as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email only" on public.contacts;
create policy "approved email only" on public.contacts as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email only" on public.activities;
create policy "approved email only" on public.activities as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email only" on public.documents;
create policy "approved email only" on public.documents as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email only" on public.document_versions;
create policy "approved email only" on public.document_versions as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email only" on public.job_documents;
create policy "approved email only" on public.job_documents as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email only" on public.job_leads;
create policy "approved email only" on public.job_leads as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email only" on public.interview_rounds;
create policy "approved email only" on public.interview_rounds as restrictive for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "approved email read" on public.job_sources;
create policy "approved email read" on public.job_sources for select to authenticated
  using ((select public.is_owner()));
drop policy if exists "approved email read" on public.job_agent_runs;
create policy "approved email read" on public.job_agent_runs for select to authenticated
  using ((select public.is_owner()));
drop policy if exists "approved email only" on storage.objects;
create policy "approved email only" on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'career-documents' or (select public.is_owner()))
  with check (bucket_id <> 'career-documents' or (select public.is_owner()));

-- ----------------------------------------------------------------------------------------------------
-- Storage: private bucket for résumés / cover letters, files under <user id>/...
-- ----------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('career-documents', 'career-documents', false, 10485760,
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict (id) do nothing;

create policy "career read" on storage.objects for select to authenticated
  using (bucket_id = 'career-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "career upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'career-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "career remove" on storage.objects for delete to authenticated
  using (bucket_id = 'career-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ----------------------------------------------------------------------------------------------------
-- Grants (Supabase default privileges usually cover these; explicit for safety. RLS still applies.)
-- ----------------------------------------------------------------------------------------------------
grant select, insert, update, delete on public.jobs, public.contacts, public.activities, public.documents,
  public.document_versions, public.job_documents, public.interview_rounds, public.job_leads to authenticated;
grant select on public.job_sources, public.job_agent_runs to authenticated;

-- ----------------------------------------------------------------------------------------------------
-- Sign-up gate: only the configured owner can create an account
-- ----------------------------------------------------------------------------------------------------
create or replace function private.only_owner_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.job_agent_config c where lower(c.owner_email) = lower(new.email)
  ) then
    raise exception 'Sign-ups are closed for this site';
  end if;
  return new;
end;
$$;
revoke all on function private.only_owner_signup() from public, anon, authenticated;

drop trigger if exists only_owner_signup on auth.users;
create trigger only_owner_signup before insert on auth.users
  for each row execute function private.only_owner_signup();

-- ----------------------------------------------------------------------------------------------------
-- Job discovery agent. The daily scan calls public.job_agent_rpc with a shared secret (hash in
-- private.job_agent_config); the real work lives in private.job_agent_op.
-- ----------------------------------------------------------------------------------------------------
-- Company / title key for matching jobs seen in email against leads and tracked jobs.
-- scripts/leads.mjs normKey() does the same in JavaScript.
create or replace function private.norm_key(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(regexp_replace(lower(coalesce(p, '')), '\m(inc|llc|ltd|corp|corporation|co|the)\M', '', 'g'), '[^a-z0-9]', '', 'g');
$$;

create or replace function private.job_agent_op(p_op text, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg private.job_agent_config;
  v_owner uuid;
  result jsonb;
  -- Start of "today" in the caller's time zone (payload 'tz'), for the daily surface cap.
  day_start timestamptz := (date_trunc('day', now() at time zone coalesce(p_payload->>'tz', 'America/New_York')))
                           at time zone coalesce(p_payload->>'tz', 'America/New_York');
begin
  select * into cfg from private.job_agent_config;
  select id into v_owner from auth.users where lower(email) = lower(cfg.owner_email);
  if v_owner is null then
    raise exception 'job_agent_op: owner account not found';
  end if;

  case p_op
  when 'known' then
    -- Which of these lead keys already exist; refresh last_seen_at on them.
    with seen as (
      update public.job_leads l set last_seen_at = now(), closed_at = null
      where l.lead_key in (select jsonb_array_elements_text(p_payload->'keys'))
      returning l.lead_key
    )
    select coalesce(jsonb_agg(lead_key), '[]'::jsonb) into result from seen;

  when 'insert' then
    insert into public.job_leads (user_id, lead_key, company, title, location, url, source, tier,
      posted_at, comp_text, base_min, base_max, description, status, filter_reason)
    select v_owner, x.lead_key, x.company, x.title, x.location, x.url, x.source, x.tier,
      x.posted_at, x.comp_text, x.base_min, x.base_max, x.description, x.status, x.filter_reason
    from jsonb_to_recordset(p_payload->'leads') as x(lead_key text, company text, title text, location text,
      url text, source text, tier int, posted_at timestamptz, comp_text text, base_min int, base_max int,
      description text, status text, filter_reason text)
    on conflict (lead_key) do nothing;
    result := jsonb_build_object('ok', true);

  when 'close_missing' then
    -- Leads from boards that were fetched successfully but no longer list them.
    update public.job_leads l set closed_at = now()
    where l.closed_at is null
      and l.company in (select jsonb_array_elements_text(p_payload->'companies'))
      and l.last_seen_at < now() - interval '1 hour';
    result := jsonb_build_object('ok', true);

  when 'pending' then
    select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into result from (
      select id, company, title, location, url, source, tier, posted_at, first_seen_at, attempts,
             comp_text, base_min, base_max, description
      from public.job_leads
      where (status = 'pending' or (status = 'error' and attempts < 3)) and closed_at is null
      order by attempts, tier nulls last, coalesce(posted_at, first_seen_at) desc
      limit coalesce((p_payload->>'limit')::int, 20)
    ) p;

  when 'save_score' then
    update public.job_leads set
      status = p_payload->>'status',
      score = (p_payload->>'score')::int,
      evaluation = p_payload->'evaluation',
      base_min = coalesce(base_min, (p_payload->>'base_min')::int),
      base_max = coalesce(base_max, (p_payload->>'base_max')::int),
      attempts = attempts + 1,
      updated_at = now()
    where id = (p_payload->>'id')::uuid and status in ('pending', 'error');
    result := jsonb_build_object('ok', true);

  when 'surface' then
    -- Promote the best scored leads into the review queue, up to the daily cap.
    with quota as (
      select greatest(0, (p_payload->>'daily_cap')::int - count(*)) as n
      from public.job_leads where surfaced_at >= day_start
    ), picked as (
      select l.id from public.job_leads l
      where l.status = 'scored' and l.closed_at is null
        and l.id in (select (jsonb_array_elements_text(p_payload->'eligible_ids'))::uuid)
      order by l.score desc, coalesce(l.posted_at, l.first_seen_at) desc
      limit (select n from quota)
    ), done as (
      update public.job_leads l set status = 'review', surfaced_at = now(), updated_at = now()
      from picked where l.id = picked.id
      returning l.id
    )
    select coalesce(jsonb_agg(id), '[]'::jsonb) into result from done;

  when 'eligible_pool' then
    -- Scored, still-open leads first seen recently: the candidates for surfacing.
    select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into result from (
      select id, score, base_max, evaluation from public.job_leads
      where status = 'scored' and closed_at is null
        and first_seen_at > now() - make_interval(days => coalesce((p_payload->>'max_age_days')::int, 14))
    ) p;

  when 'feedback' then
    -- The candidate's recent accept/reject decisions, fed back to the scorer.
    select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) into result from (
      select company, title, status, reject_reason, score from public.job_leads
      where status in ('accepted', 'rejected') and decided_at is not null
      order by decided_at desc
      limit coalesce((p_payload->>'limit')::int, 25)
    ) f;

  when 'sources' then
    select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) into result from public.job_sources s;

  when 'save_sources' then
    insert into public.job_sources (company, board, status, jobs_seen, last_checked_at, last_error)
    select x.company, x.board, x.status, x.jobs_seen, now(), x.last_error
    from jsonb_to_recordset(p_payload->'sources') as x(company text, board text, status text, jobs_seen int, last_error text)
    on conflict (company) do update set board = excluded.board, status = excluded.status,
      jobs_seen = excluded.jobs_seen, last_checked_at = excluded.last_checked_at, last_error = excluded.last_error;
    result := jsonb_build_object('ok', true);

  when 'dupes' then
    -- Which email items (by index) are already a lead or a tracked job, matched on company + title.
    with items as (
      select x.i, private.norm_key(x.company) as c, private.norm_key(x.title) as t
      from jsonb_to_recordset(p_payload->'items') as x(i int, company text, title text)
    ), hits as (
      select items.i, 'lead' as kind, l.status from items join public.job_leads l
        on private.norm_key(l.company) = items.c and private.norm_key(l.title) = items.t
      union all
      select items.i, 'tracker', j.stage from items join public.jobs j
        on j.user_id = v_owner and private.norm_key(j.company) = items.c and private.norm_key(j.title) = items.t
    )
    select coalesce(jsonb_agg(jsonb_build_object('i', i, 'kind', kind, 'status', status)), '[]'::jsonb) into result
    from (select distinct on (i) * from hits order by i, kind) h;

  when 'add_outreach' then
    -- Recruiter messages with no findable posting become tracker rows in the Recruiter outreach stage.
    -- The email id kept in notes makes this safe to repeat.
    declare
      it record;
      v_job uuid;
      n_added int := 0;
      n_skipped int := 0;
    begin
      for it in select * from jsonb_to_recordset(p_payload->'items') as x(email_id text, company text, title text,
          recruiter text, channel text, url text, received_at timestamptz, summary text, details text)
      loop
        if coalesce(it.email_id, '') !~ '^[A-Za-z0-9_-]+$' or exists (
          select 1 from public.jobs j where j.user_id = v_owner and j.notes like '%[email:' || it.email_id || ']%'
        ) then
          n_skipped := n_skipped + 1;
          continue;
        end if;
        insert into public.jobs (user_id, company, title, stage, source, recruiter, posting_url, last_contact,
          next_action, action_owner, notes)
        values (v_owner, coalesce(nullif(it.company, ''), 'Unknown company'), coalesce(nullif(it.title, ''), 'Unnamed role'),
          'Recruiter outreach', 'Recruiter outreach (' || coalesce(nullif(it.channel, ''), 'Email') || ')', it.recruiter, it.url,
          coalesce(it.received_at, now())::date, 'Reply to recruiter', 'Me',
          coalesce(it.summary, '') || E'\n[email:' || it.email_id || ']')
        returning id into v_job;
        insert into public.activities (user_id, job_id, kind, occurred_at, summary, details, direction, channel,
          stage_at_time, status)
        values (v_owner, v_job, 'Recruiter message', coalesce(it.received_at, now()),
          'Recruiter message' || coalesce(' from ' || nullif(it.recruiter, ''), ''), it.details, 'incoming',
          coalesce(nullif(it.channel, ''), 'Email'), 'Recruiter outreach', 'received');
        n_added := n_added + 1;
      end loop;
      result := jsonb_build_object('added', n_added, 'skipped', n_skipped);
    end;

  when 'log_run' then
    insert into public.job_agent_runs (started_at, finished_at, stats)
    values ((p_payload->>'started_at')::timestamptz, now(), p_payload->'stats');
    result := jsonb_build_object('ok', true);

  else
    raise exception 'job_agent_op: unknown op %', p_op;
  end case;

  return result;
end;
$$;

revoke all on function private.job_agent_op(text, jsonb) from public, anon, authenticated;

create or replace function public.job_agent_rpc(p_secret text, p_op text, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg private.job_agent_config;
begin
  select * into cfg from private.job_agent_config;
  if cfg is null or encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex') <> cfg.secret_sha256 then
    raise exception 'job_agent_rpc: unauthorized' using errcode = '42501';
  end if;
  return private.job_agent_op(p_op, p_payload);
end;
$$;

revoke all on function public.job_agent_rpc(text, text, jsonb) from public, authenticated;
grant execute on function public.job_agent_rpc(text, text, jsonb) to anon;

-- Recent scored leads (with their postings) so a model or prompt change can be compared against earlier scores.
-- Same secret check as job_agent_rpc. Only leads scored before the scorer started stamping evaluation.model are returned.
create or replace function public.job_agent_scored_sample(p_secret text, p_limit int default 12)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg private.job_agent_config;
  result jsonb;
begin
  select * into cfg from private.job_agent_config;
  if cfg is null or encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex') <> cfg.secret_sha256 then
    raise exception 'job_agent_scored_sample: unauthorized' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) into result from (
    select id, company, title, location, url, source, tier, posted_at, first_seen_at, comp_text, base_min, base_max,
           description, score, evaluation->>'recommendation' as recommendation, evaluation->>'match_type' as match_type
    from public.job_leads
    where score is not null and description is not null and evaluation->>'model' is null
    order by updated_at desc
    limit greatest(1, least(coalesce(p_limit, 12), 30))
  ) s;
  return result;
end;
$$;
revoke all on function public.job_agent_scored_sample(text, int) from public, authenticated;
grant execute on function public.job_agent_scored_sample(text, int) to anon;
