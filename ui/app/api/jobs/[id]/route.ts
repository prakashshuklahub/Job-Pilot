import { NextResponse } from 'next/server';
import { isValidJobStatus } from '@/lib/job-status';
import { formatApiError, getSupabaseAdmin } from '@/lib/supabase';
import { TABLES } from '@/lib/tables';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = body?.status;

    if (!isValidJobStatus(status)) {
      return NextResponse.json(
        { error: `Invalid status. Use one of: pending, applied, interview` },
        { status: 400 },
      );
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from(TABLES.jobs)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ job: data });
  } catch (err) {
    return NextResponse.json({ error: formatApiError(err) }, { status: 500 });
  }
}
