-- Career-Ops UI schema (Supabase / Postgres)
-- Run in Supabase SQL Editor (safe to re-run).
--
-- Uses career_ops_* table names so we do NOT collide with an existing public.jobs
-- table from another app (different columns). Your other tables are untouched.

create extension if not exists "pgcrypto";

-- Dedupe memory (mirrors scan-history.tsv)
create table if not exists career_ops_seen_urls (
  url text primary key,
  first_seen date not null,
  status text not null default 'added',
  company text,
  role text,
  location text,
  source text,
  created_at timestamptz not null default now()
);

-- Job inbox (mirrors pipeline.md pending items)
create table if not exists career_ops_jobs (
  id uuid primary key default gen_random_uuid(),
  url text unique not null,
  company text not null,
  role text not null,
  location text,
  source text,
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'interview')),
  score numeric(3,1),
  report_path text,
  pdf_path text,
  first_seen date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_ops_jobs_status_idx on career_ops_jobs (status);
create index if not exists career_ops_jobs_first_seen_idx on career_ops_jobs (first_seen desc);
create index if not exists career_ops_jobs_company_idx on career_ops_jobs (company);

-- Scan audit log (daily pull summary)
create table if not exists career_ops_scan_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  trigger text not null check (trigger in ('cron', 'manual')),
  companies_scanned int,
  job_boards_scanned int,
  total_found int,
  filtered_title int,
  filtered_location int,
  filtered_salary int,
  filtered_content int,
  duplicates_skipped int,
  new_added int,
  errors jsonb,
  ok boolean
);

create index if not exists career_ops_scan_runs_started_idx on career_ops_scan_runs (started_at desc);

-- Optional: applications mirror (sync from applications.md later)
create table if not exists career_ops_applications (
  id uuid primary key default gen_random_uuid(),
  num int,
  applied_date date,
  company text not null,
  role text not null,
  score text,
  status text,
  pdf text,
  report_path text,
  notes text,
  job_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company, role)
);

-- RLS: API uses service_role (bypasses RLS). Anon key = read-only for jobs + scan_runs.
alter table career_ops_jobs enable row level security;
alter table career_ops_scan_runs enable row level security;
alter table career_ops_seen_urls enable row level security;
alter table career_ops_applications enable row level security;

drop policy if exists "anon read career_ops_jobs" on career_ops_jobs;
create policy "anon read career_ops_jobs" on career_ops_jobs for select to anon using (true);

drop policy if exists "anon read career_ops_scan_runs" on career_ops_scan_runs;
create policy "anon read career_ops_scan_runs" on career_ops_scan_runs for select to anon using (true);

-- Legacy status migration: run supabase/migrate-job-status.sql on existing projects.
