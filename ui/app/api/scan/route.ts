import { NextResponse } from 'next/server';
import { runCareerOpsScan } from '@/lib/run-scan';

export const maxDuration = 300;

/** Manual scan from UI button */
export async function POST() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { code, output } = await runCareerOpsScan('manual');
  return NextResponse.json({
    ok: code === 0,
    trigger: 'manual',
    exitCode: code,
    tail: output.slice(-4000),
  });
}
