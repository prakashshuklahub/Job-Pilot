#!/usr/bin/env node
/**
 * One-time migration: career_ops_jobs status → pending | applied | interview only.
 *
 * Usage: node ui/scripts/migrate-job-status.mjs
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

const ALLOWED = ['pending', 'applied', 'interview'];
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createCareerOpsSupabaseClient(url, key);

const { data: rows, error } = await sb.from(TABLES.jobs).select('id, status');
if (error) {
  console.error('Failed to read jobs:', error.message);
  process.exit(1);
}

const stale = (rows ?? []).filter((r) => !ALLOWED.includes(r.status));
if (stale.length === 0) {
  console.log('No rows with legacy status values.');
} else {
  console.log(`Updating ${stale.length} row(s) to pending…`);
  for (const row of stale) {
    const { error: upErr } = await sb
      .from(TABLES.jobs)
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (upErr) {
      console.error(`  ${row.id} (${row.status}): ${upErr.message}`);
    } else {
      console.log(`  ${row.status} → pending`);
    }
  }
}

console.log(`
── Run this once in Supabase → SQL Editor (updates CHECK constraint) ──

See: supabase/migrate-job-status.sql
`);
