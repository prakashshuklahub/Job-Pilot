import { NextResponse } from 'next/server';
import {
  authCookieName,
  createSessionToken,
  isAuthEnabled,
  sessionCookieOptions,
} from '@/lib/auth';
import { verifyPassword } from '@/lib/auth-password';

export async function POST(request: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: 'UI_PASSWORD not configured' }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const password = body.password ?? '';
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Session unavailable' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName(), token, sessionCookieOptions);
  return res;
}
