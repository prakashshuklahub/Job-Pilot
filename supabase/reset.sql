-- Wipe all Career-Ops UI data (keeps tables + schema). Safe to re-run.
-- Does NOT touch other tables in your Supabase project (e.g. public.jobs).

truncate table career_ops_jobs restart identity cascade;
truncate table career_ops_seen_urls restart identity cascade;
truncate table career_ops_scan_runs restart identity cascade;
truncate table career_ops_applications restart identity cascade;
