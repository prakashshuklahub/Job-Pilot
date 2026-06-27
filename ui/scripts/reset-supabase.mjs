#!/usr/bin/env node
/**
 * Delete all rows from career_ops_* tables (fresh inbox).
 *
 * Usage: node ui/scripts/reset-supabase.mjs
 * SQL alternative: supabase/reset.sql in Supabase SQL Editor
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

const tables = [
  { name: TABLES.jobs, filter: 'id' },
  { name: TABLES.seenUrls, filter: 'url' },
  { name: TABLES.scanRuns, filter: 'id' },
  { name: TABLES.applications, filter: 'id' },
];

for (const { name, filter } of tables) {
  const { error, count } = await sb.from(name).delete({ count: 'exact' }).not(filter, 'is', null);
  if (error) {
    console.error(`✗ ${name}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${name}: deleted ${count ?? 0} row(s)`);
}

console.log('\nDone — Career-Ops Supabase tables are empty. Run Scan to refill.');
