#!/usr/bin/env node
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createCareerOpsSupabaseClient } from '../../lib/supabase-client.mjs';
import { TABLES } from '../../lib/supabase-tables.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
for (const p of [join(root, '.env'), join(root, 'ui', '.env.local')]) {
  if (existsSync(p)) config({ path: p });
}

const sb = createCareerOpsSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.from(TABLES.jobs).select('source, location, company, role');
if (error) {
  console.error(error.message);
  process.exit(1);
}

const bySource = {};
const byCountry = { Germany: 0, Poland: 0, Netherlands: 0, Belgium: 0, Sweden: 0, Denmark: 0, RemoteEU: 0, Other: 0, Empty: 0 };
const hints = {
  Germany: ['germany', 'deutschland', 'berlin', 'munich', 'münchen', 'hamburg', 'frankfurt', 'dach', 'cologne', 'stuttgart'],
  Poland: ['poland', 'polska', 'warsaw', 'warszawa', 'krakow', 'kraków', 'wroclaw', 'gdansk'],
  Netherlands: ['netherlands', 'nederland', 'holland', 'amsterdam', 'rotterdam', 'utrecht', 'eindhoven'],
  Belgium: ['belgium', 'belgique', 'brussels', 'antwerp', 'ghent'],
  Sweden: ['sweden', 'sverige', 'stockholm', 'gothenburg', 'göteborg', 'malmo'],
  Denmark: ['denmark', 'danmark', 'copenhagen', 'københavn', 'aarhus'],
};

for (const j of data ?? []) {
  bySource[j.source || 'unknown'] = (bySource[j.source || 'unknown'] || 0) + 1;
  const loc = (j.location || '').toLowerCase();
  if (!loc.trim()) {
    byCountry.Empty++;
    continue;
  }
  let matched = false;
  for (const [country, words] of Object.entries(hints)) {
    if (words.some((w) => loc.includes(w))) {
      byCountry[country]++;
      matched = true;
      break;
    }
  }
  if (!matched) {
    if (/remote|europe|\beu\b|emea|worldwide|anywhere/.test(loc)) byCountry.RemoteEU++;
    else byCountry.Other++;
  }
}

console.log(JSON.stringify({ total: data?.length ?? 0, bySource, byCountry }, null, 2));
