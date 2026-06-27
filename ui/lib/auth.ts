const COOKIE_NAME = 'career_ops_auth';
const SESSION_MSG = 'career-ops-ui-session-v1';

export function authCookieName() {
  return COOKIE_NAME;
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.UI_PASSWORD?.length);
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

export async function createSessionToken(): Promise<string | null> {
  const pw = process.env.UI_PASSWORD;
  if (!pw) return null;
  return hmacHex(pw, SESSION_MSG);
}

export async function verifySessionCookie(value: string | undefined): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  const expected = await createSessionToken();
  if (!expected || !value) return false;
  return timingSafeEqualStr(value, expected);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};
