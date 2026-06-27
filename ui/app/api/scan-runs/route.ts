import { NextResponse } from 'next/server';
import { formatApiError, getSupabaseAdmin } from '@/lib/supabase';
import { TABLES } from '@/lib/tables';

export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from(TABLES.scanRuns)
      .select('*')
      .order('started_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return NextResponse.json({ runs: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: formatApiError(err) }, { status: 500 });
  }
}
