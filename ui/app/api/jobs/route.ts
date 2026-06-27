import { NextResponse } from 'next/server';
import {
  buildLocationOrFilter,
  findMarketCountry,
} from '@/lib/market-countries';
import { formatApiError, getSupabaseAdmin } from '@/lib/supabase';
import { TABLES } from '@/lib/tables';

export async function GET(request: Request) {
  try {
    const sb = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 25), 1), 100);
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

    let q = sb
      .from(TABLES.jobs)
      .select('*', { count: 'exact' })
      .order('first_seen', { ascending: false })
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);

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
    });
  } catch (err) {
    return NextResponse.json({ error: formatApiError(err) }, { status: 500 });
  }
}
