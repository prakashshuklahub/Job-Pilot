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

### 3. Local dev

```bash
cd ui
cp .env.example .env.local
# fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

1. Push repo to GitHub
2. [vercel.com](https://vercel.com) → Import project
3. **Root Directory:** `ui`
4. Environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (random string — Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`)
5. Deploy

**Cron:** `vercel.json` runs `/api/cron/scan` daily at **06:00 UTC**.

**Note:** Full scan takes ~1–2 minutes. Requires **Vercel Pro** (`maxDuration: 300`) or scan may timeout on Hobby (10s). Manual "Scan now" has the same limit.

### 5. Local scan still syncs to Supabase

```bash
# from repo root
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
npm run scan
```

When env vars are set, `scan.mjs` writes to Supabase **and** `data/pipeline.md`.

## Architecture

```
npm run scan / Vercel cron
        │
        ▼
   scan.mjs (same filters + dedupe)
        │
        ├── data/pipeline.md (local, optional)
        └── Supabase jobs + scan_runs + seen_urls
                │
                ▼
           Next.js UI on Vercel
```

## Dedupe

Same as CLI: URL in `seen_urls` or `jobs` → not added again on next scan.
