/**
 * Server-side Supabase client for career-ops (REST only).
 * - New sb_secret_ / sb_publishable_ keys are opaque (not JWTs) — apikey header only.
 * - Node < 22: polyfill WebSocket via ws for supabase-js init.
 */

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(fileURLToPath(import.meta.url));

export function isOpaqueSupabaseKey(key) {
  return key.startsWith('sb_secret_') || key.startsWith('sb_publishable_');
}

function ensureNodeWebSocket() {
  if (typeof globalThis.WebSocket !== 'undefined') return;
  try {
    globalThis.WebSocket = require('ws');
  } catch {
    // Realtime unused for REST; ignore if ws missing
  }
}

/** @param {string} url @param {string} key */
export function createCareerOpsSupabaseClient(url, key) {
  ensureNodeWebSocket();

  const isOpaque = isOpaqueSupabaseKey(key);
  const options = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: key } },
  };

  if (isOpaque) {
    options.global.fetch = (input, init = {}) => {
      const headers = new Headers(init.headers ?? {});
      headers.set('apikey', key);
      headers.delete('Authorization');
      return fetch(input, { ...init, headers });
    };
  }

  return createClient(url, key, options);
}
