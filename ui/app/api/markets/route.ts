import { NextResponse } from 'next/server';
import { loadProfileCountryLists } from '@/lib/load-profile-countries';
import {
  REMOTE_COUNTRY_ID,
  resolveMarketCountries,
} from '@/lib/market-countries';

export async function GET() {
  const { primary, all } = loadProfileCountryLists();
  const countries = resolveMarketCountries(primary, all).map((c) => ({
    ...c,
    primary: primary.some((p) => p.toLowerCase() === c.label.toLowerCase()),
  }));

  return NextResponse.json({
    primaryCountryLabels: primary,
    countries,
    remote: { id: REMOTE_COUNTRY_ID, label: 'Remote / EU' },
  });
}
