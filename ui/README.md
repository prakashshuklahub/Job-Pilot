# Career-Ops Web UI (Vercel + Supabase)

Browser dashboard for daily job scans. Uses the **same** `scan.mjs` logic, filters, and dedupe as the CLI — results go to **Supabase** instead of only markdown.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run `../supabase/schema.sql`
3. Copy **Project URL**, **service_role** key, and **anon** key

### 2. Fresh start (default)

No import needed. Supabase starts empty. Click **Scan now** in the UI (or wait for daily cron) to pull new jobs.

Optional: to migrate an old `data/pipeline.md` inbox, run `node scripts/import-pipeline-to-supabase.mjs` — skip this if you want a clean slate.

### 3. Local dev (same Supabase as production)

```bash
cd ui
cp .env.example .env.local   # optional — only CRON_SECRET or overrides

# Supabase credentials live in repo root .env (shared with npm run scan):
#   SUPABASE_URL
#   SUPABASE_SERVICE_ROLE_KEY

# Dashboard password (locks UI + APIs when set; required on Vercel production):
#   UI_PASSWORD=your-secret

npm install
npm run dev
```

Open http://localhost:3000 — you will see the **same jobs** as on Vercel because both use one Supabase project.

### 4. Deploy to Vercel

1. **Commit `portals.yml`** (repo root) — Vercel builds from git; the scan bundle copies this file at deploy time. It has no secrets (filters + job boards). Keep `config/profile.yml` and `.env` **out** of git.
   ```bash
   git add portals.yml
   git commit -m "chore: add portals config for Vercel scan"
   git push
   ```
2. [vercel.com](https://vercel.com) → Import project
3. **Root Directory:** `ui`
4. Environment variables (same Supabase project as local `../.env`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `UI_PASSWORD` (locks all pages and API routes — login screen)
   - `CRON_SECRET` (random string — Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`)
5. Deploy

**Cron:** `vercel.json` runs `/api/cron/scan` daily at **06:00 UTC**.

**Note:** Full scan takes ~1–2 minutes. Requires **Vercel Pro** (`maxDuration: 300`) or scan may timeout on Hobby (10s). Manual "Scan now" has the same limit.

**Sync model:** Local UI and Vercel UI both read the **same Supabase** database. `profile.yml` is only for Cursor evaluations locally — not pushed, not needed on Vercel.

### 5. CLI scan (same Supabase)

```bash
# from repo root — reads .env automatically
npm run scan
```

When `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, scans write **only to Supabase** (not `data/pipeline.md`). Local UI and Vercel always show the same inbox.

## Architecture

```
npm run scan / Vercel cron / UI "Scan now"
        │
        ▼
   scan.mjs (same filters + dedupe)
        │
        └── Supabase (single source of truth)
              jobs + seen_urls + scan_runs
                │
                ▼
           Next.js UI (local + Vercel)
```

## Dedupe

Same as CLI: URL in `seen_urls` or `jobs` → not added again on next scan.
