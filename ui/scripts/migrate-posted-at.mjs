#!/usr/bin/env node
/**
 * Verify career_ops_jobs.posted_at column exists (run SQL migration if missing).
 *
 * Usage: node ui/scripts/migrate-posted-at.mjs
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createCareerOpsSupabaseClient } from '../../lib/supabase-client.mjs';
import { TABLES } from '../../lib/supabase-tables.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
for (const p of [join(root, '.env'), join(root, 'ui', '.env.local')]) {
  if (existsSync(p)) config({ path: p });
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createCareerOpsSupabaseClient(url, key);
const { error } = await sb.from(TABLES.jobs).select('posted_at').limit(1);

if (error) {
  console.error('posted_at column missing or unreadable:', error.message);
  console.log(`
Run once in Supabase → SQL Editor:

  supabase/migrate-posted-at.sql
`);
  process.exit(1);
}

console.log('✓ career_ops_jobs.posted_at is available');
