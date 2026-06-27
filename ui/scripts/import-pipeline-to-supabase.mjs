import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

/**
 * One-time import: pipeline.md + scan-history.tsv → Supabase
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-pipeline-to-supabase.mjs
 */
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pipelinePath = path.join(root, 'data/pipeline.md');

if (!existsSync(pipelinePath)) {
  console.error('No data/pipeline.md found');
  process.exit(1);
}

const text = readFileSync(pipelinePath, 'utf-8');
const jobs = [];
for (const line of text.split('\n')) {
  const m = line.match(/^- \[ \] (https?:\/\/\S+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/);
  if (!m) continue;
  jobs.push({
    url: m[1].trim(),
    company: m[2].trim(),
    role: m[3].trim(),
    status: 'pending',
    first_seen: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  });
}

console.log(`Importing ${jobs.length} jobs…`);
const { error } = await sb.from('jobs').upsert(jobs, { onConflict: 'url' });
if (error) {
  console.error(error.message);
  process.exit(1);
}

const seen = jobs.map((j) => ({
  url: j.url,
  first_seen: j.first_seen,
  status: 'added',
  company: j.company,
  role: j.role,
}));
await sb.from('seen_urls').upsert(seen, { onConflict: 'url' });
console.log('Done.');
