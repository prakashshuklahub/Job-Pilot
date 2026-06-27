import { NextResponse } from 'next/server';
import { authCookieName, sessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName(), '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
