#!/usr/bin/env node
/**
 * Delete all rows from career_ops_* tables and clear local scan files (fresh inbox).
 *
 * Usage: node ui/scripts/reset-supabase.mjs
 * SQL alternative: supabase/reset.sql in Supabase SQL Editor (DB only)
 */
import { config } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createCareerOpsSupabaseClient } from '../../lib/supabase-client.mjs';
import { TABLES } from '../../lib/supabase-tables.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
for (const p of [join(root, '.env'), join(root, 'ui', '.env.local')]) {
  if (existsSync(p)) config({ path: p });
}

const SCAN_HISTORY_HEADER = 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\tlocation\n';
const PIPELINE_EMPTY = `# Pipeline — Pending URLs

Paste job URLs below as \`- [ ] {url}\` then run \`/career-ops pipeline\`.

## Pending

## Processed
`;

function resetLocalScanFiles() {
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'data', 'scan-history.tsv'), SCAN_HISTORY_HEADER, 'utf-8');
  writeFileSync(join(root, 'data', 'pipeline.md'), PIPELINE_EMPTY, 'utf-8');
  console.log('✓ data/scan-history.tsv: cleared (header only)');
  console.log('✓ data/pipeline.md: cleared');
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

resetLocalScanFiles();

console.log('\nDone — Career-Ops Supabase tables and local scan files are empty. Run Scan to refill.');
