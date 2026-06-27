#!/usr/bin/env node
/**
 * Bundle career-ops scan runtime into ui/.career-ops for Vercel deployment.
 * Root Directory on Vercel = ui — parent repo files are not available at runtime.
 */
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const dest = path.join(__dirname, '../.career-ops');

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

const copy = (rel) => {
  const src = path.join(repoRoot, rel);
  const target = path.join(dest, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(src, target, { recursive: true });
};

copy('scan.mjs');
copy('providers');
copy('lib');
copy('portals.yml');

writeFileSync(
  path.join(dest, 'package.json'),
  JSON.stringify(
    {
      name: 'career-ops-scan-bundle',
      private: true,
      type: 'module',
      dependencies: {
        'js-yaml': '^4.1.1',
        '@supabase/supabase-js': '^2.49.1',
        ws: '^8.18.1',
      },
    },
    null,
    2,
  ),
  'utf-8',
);

mkdirSync(path.join(dest, 'data'), { recursive: true });
if (!existsSync(path.join(dest, 'data', 'scan-history.tsv'))) {
  writeFileSync(
    path.join(dest, 'data', 'scan-history.tsv'),
    'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\tlocation\n',
    'utf-8',
  );
}

console.log('Installing scan bundle dependencies…');
const install = spawnSync('npm', ['install', '--omit=dev'], { cwd: dest, stdio: 'inherit' });
if (install.status !== 0) process.exit(install.status ?? 1);
console.log('career-ops scan bundle ready at ui/.career-ops');
