import { NextResponse } from 'next/server';
import { assertCronAuth, runCareerOpsScan } from '@/lib/run-scan';

export const maxDuration = 300;

/** Vercel Cron — daily scan at 06:00 UTC (see vercel.json) */
export async function GET(request: Request) {
  if (!assertCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { code, output } = await runCareerOpsScan('cron');
  return NextResponse.json({
    ok: code === 0,
    trigger: 'cron',
    exitCode: code,
    tail: output.slice(-4000),
  });
}
