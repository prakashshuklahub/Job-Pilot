-- Wipe all Career-Ops data (keeps tables + schema). Safe to re-run.
-- Does NOT touch other tables in your Supabase project (e.g. public.jobs).
--
-- Clears:
--   career_ops_jobs          — job inbox (incl. posted_at when set)
--   career_ops_seen_urls     — scan dedup memory (every URL the scanner touched)
--   career_ops_scan_runs     — scan history (manual + cron run log shown in UI)
--   career_ops_applications  — applications mirror
--
-- Local files (data/scan-history.tsv, data/pipeline.md) are NOT cleared by SQL.
-- For a full reset including local scan files, run: node ui/scripts/reset-supabase.mjs

truncate table
  career_ops_jobs,
  career_ops_seen_urls,
  career_ops_scan_runs,
  career_ops_applications
restart identity cascade;
