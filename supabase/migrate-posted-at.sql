-- Add employer publish date to job inbox (nullable — many feeds omit it).
-- Run once in Supabase → SQL Editor.

alter table career_ops_jobs
  add column if not exists posted_at date;

create index if not exists career_ops_jobs_posted_at_idx
  on career_ops_jobs (posted_at desc nulls last);
