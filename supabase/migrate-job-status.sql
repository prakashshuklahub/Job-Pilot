-- Migrate career_ops_jobs to three statuses only: pending, applied, interview.
-- Run once in Supabase → SQL Editor.

update career_ops_jobs set status = 'pending'
  where status not in ('pending', 'applied', 'interview');

alter table career_ops_jobs drop constraint if exists career_ops_jobs_status_check;
alter table career_ops_jobs add constraint career_ops_jobs_status_check
  check (status in ('pending', 'applied', 'interview'));
