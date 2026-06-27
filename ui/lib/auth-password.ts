import { timingSafeEqual } from 'crypto';

/** Node runtime only (API login route). */
export function verifyPassword(input: string): boolean {
  const pw = process.env.UI_PASSWORD;
  if (!pw) return true;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
