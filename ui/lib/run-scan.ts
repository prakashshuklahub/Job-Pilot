import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export const maxDuration = 300;

export type ScanTrigger = 'cron' | 'manual';

export function runCareerOpsScan(trigger: ScanTrigger): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const bundleRoot = path.join(process.cwd(), '.career-ops');
    const repoRoot = path.resolve(process.cwd(), '..');
    const useRepoRoot =
      process.env.CAREER_OPS_SCAN_FROM_REPO === '1' ||
      (process.env.NODE_ENV !== 'production' && existsSync(path.join(repoRoot, 'scan.mjs')));
    const cwd = useRepoRoot ? repoRoot : bundleRoot;

    const chunks: string[] = [];

    const child = spawn('node', ['scan.mjs'], {
      cwd,
      env: {
        ...process.env,
        SCAN_TRIGGER: trigger,
        NODE_ENV: 'production',
      },
    });

    child.stdout.on('data', (d) => chunks.push(String(d)));
    child.stderr.on('data', (d) => chunks.push(String(d)));
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code: code ?? 1, output: chunks.join('') });
    });
  });
}

export function assertCronAuth(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}
