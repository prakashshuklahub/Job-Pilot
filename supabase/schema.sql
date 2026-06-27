-- Career-Ops UI schema (Supabase / Postgres)
-- Run in Supabase SQL Editor or: supabase db push

create extension if not exists "pgcrypto";

-- Dedupe memory (mirrors scan-history.tsv)
create table if not exists seen_urls (
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
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  url text unique not null,
  company text not null,
  role text not null,
  location text,
  source text,
  status text not null default 'pending'
    check (status in ('pending', 'evaluated', 'applied', 'discarded', 'expired')),
  score numeric(3,1),
  report_path text,
  pdf_path text,
  first_seen date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on jobs (status);
create index if not exists jobs_first_seen_idx on jobs (first_seen desc);
create index if not exists jobs_company_idx on jobs (company);

-- Scan audit log (daily pull summary)
create table if not exists scan_runs (
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

create index if not exists scan_runs_started_idx on scan_runs (started_at desc);

-- Optional: applications mirror (sync from applications.md later)
create table if not exists applications (
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
alter table jobs enable row level security;
alter table scan_runs enable row level security;
alter table seen_urls enable row level security;
alter table applications enable row level security;

create policy "anon read jobs" on jobs for select to anon using (true);
create policy "anon read scan_runs" on scan_runs for select to anon using (true);
