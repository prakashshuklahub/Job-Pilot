import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/** Load KEY=VALUE lines into process.env when unset (local + prod share one Supabase project). */
function loadEnvFile(filePath, { override = false } = {}) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (override || process.env[key] === undefined) process.env[key] = val;
  }
}

const uiDir = path.dirname(fileURLToPath(import.meta.url));
// Repo root .env first, then ui/.env.local overrides (CRON_SECRET, etc.)
loadEnvFile(path.join(uiDir, '../.env'));
loadEnvFile(path.join(uiDir, '.env.local'), { override: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ws'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
};

export default nextConfig;
