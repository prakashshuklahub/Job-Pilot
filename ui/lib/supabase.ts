import { createClient, SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient | null = null;

function isOpaqueSupabaseKey(key: string) {
  return key.startsWith('sb_secret_') || key.startsWith('sb_publishable_');
}

function ensureNodeWebSocket() {
  if (typeof globalThis.WebSocket !== 'undefined') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    globalThis.WebSocket = require('ws');
  } catch {
    // REST-only; ignore if ws unavailable
  }
}

function createServerClient(url: string, key: string): SupabaseClient {
  ensureNodeWebSocket();
  const isOpaque = isOpaqueSupabaseKey(key);
  const options: Parameters<typeof createClient>[2] = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: key } },
  };
  if (isOpaque) {
    options.global!.fetch = (input, init = {}) => {
      const headers = new Headers(init.headers ?? {});
      headers.set('apikey', key);
      headers.delete('Authorization');
      return fetch(input, { ...init, headers });
    };
  }
  return createClient(url, key, options);
}

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to ui/.env.local or repo root .env',
    );
  }
  admin = createServerClient(url, key);
  return admin;
}

export function getSupabaseAnon(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createServerClient(url, key);
}

export function formatApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg.includes('PGRST205') || msg.includes('schema cache')) {
      return 'Database tables missing. In Supabase → SQL Editor, run supabase/schema.sql (creates career_ops_* tables).';
    }
    if (/jwt.*future|issued at future/i.test(msg)) {
      return [
        'Supabase auth error (JWT issued at future).',
        'Fix: System Settings → Date & Time → enable “Set time automatically”, then restart the dev server.',
        'Or use the legacy service_role JWT (starts with eyJ…) from Supabase → Project Settings → API.',
      ].join(' ');
    }
    return msg;
  }
  return 'Unknown error';
}
