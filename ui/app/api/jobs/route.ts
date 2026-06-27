import { NextResponse } from 'next/server';
import { isValidJobStatus } from '@/lib/job-status';
import {
  buildLocationOrFilter,
  findMarketCountry,
} from '@/lib/market-countries';
import { formatApiError, getSupabaseAdmin } from '@/lib/supabase';
import { TABLES } from '@/lib/tables';

function isValidDateParam(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export async function GET(request: Request) {
  try {
    const sb = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 25), 1), 100);
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

    if (status && status !== 'all' && !isValidJobStatus(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }
    if (dateFrom && !isValidDateParam(dateFrom)) {
      return NextResponse.json({ error: 'Invalid dateFrom (use YYYY-MM-DD)' }, { status: 400 });
    }
    if (dateTo && !isValidDateParam(dateTo)) {
      return NextResponse.json({ error: 'Invalid dateTo (use YYYY-MM-DD)' }, { status: 400 });
    }

    let q = sb
      .from(TABLES.jobs)
      .select('*', { count: 'exact' })
      .order('first_seen', { ascending: false })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') q = q.eq('status', status);
    if (dateFrom) q = q.gte('first_seen', dateFrom);
    if (dateTo) q = q.lte('first_seen', dateTo);

    if (country && country !== 'all') {
      const market = findMarketCountry(country);
      if (!market) {
        return NextResponse.json({ error: `Unknown country filter: ${country}` }, { status: 400 });
      }
      q = q.or(buildLocationOrFilter(market.keywords));
    }

    q = q.range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) throw error;

    return NextResponse.json({
      jobs: data ?? [],
      total: count ?? 0,
      limit,
      offset,
      country: country ?? 'all',
      status: status ?? 'all',
      dateFrom: dateFrom ?? null,
      dateTo: dateTo ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: formatApiError(err) }, { status: 500 });
  }
}
