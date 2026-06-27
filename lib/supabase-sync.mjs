/**
 * lib/supabase-sync.mjs — Supabase persistence for scan + UI
 * Used by scan.mjs (when env set) and the Next.js UI on Vercel.
 */

import { createCareerOpsSupabaseClient } from './supabase-client.mjs';
import { TABLES } from './supabase-tables.mjs';

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** When true, scans read/write Supabase only (no pipeline.md / scan-history.tsv). Default: on if Supabase env is set. */
export function isSupabasePrimary() {
  if (!isSupabaseConfigured()) return false;
  const raw = String(process.env.CAREER_OPS_SUPABASE_PRIMARY ?? '').toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'no') return false;
  return true;
}

export function offersToSeenRows(offers, date, status = 'added') {
  return offers.map((o) => ({
    url: o.url,
    first_seen: date,
    status,
    company: o.company ?? null,
    role: o.title ?? o.role ?? null,
    location: o.location || null,
    source: o.source || null,
  }));
}

/** @param {{ postedAt?: number | string | null }} offer */
export function offerPostedAtDate(offer) {
  const ms = offer?.postedAt;
  if (ms == null || !Number.isFinite(Number(ms))) return null;
  return new Date(Number(ms)).toISOString().slice(0, 10);
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return createCareerOpsSupabaseClient(url, key);
}

/** Merge remote seen URLs into the in-memory dedup set. */
export async function fetchSeenUrlsFromSupabase() {
  if (!isSupabaseConfigured()) return new Set();
  const sb = getSupabaseAdmin();
  const seen = new Set();
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from(TABLES.seenUrls)
      .select('url')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Supabase seen_urls: ${error.message}`);
    if (!data?.length) break;
    for (const row of data) {
      if (row.url) seen.add(row.url);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return seen;
}

export async function fetchSeenCompanyRolesFromSupabase() {
  if (!isSupabaseConfigured()) return new Set();
  const sb = getSupabaseAdmin();
  const seen = new Set();
  const { data, error } = await sb.from(TABLES.jobs).select('company, role');
  if (error) throw new Error(`Supabase jobs company/role: ${error.message}`);
  for (const row of data ?? []) {
    if (row.company && row.role) {
      seen.add(`${row.company.toLowerCase()}::${row.role.toLowerCase()}`);
    }
  }
  const { data: apps, error: appErr } = await sb.from(TABLES.applications).select('company, role');
  if (!appErr) {
    for (const row of apps ?? []) {
      if (row.company && row.role) {
        seen.add(`${row.company.toLowerCase()}::${row.role.toLowerCase()}`);
      }
    }
  }
  return seen;
}

export async function startScanRun(trigger = 'manual') {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from(TABLES.scanRuns)
    .insert({ trigger, ok: null })
    .select('id')
    .single();
  if (error) throw new Error(`startScanRun: ${error.message}`);
  return data.id;
}

export async function finishScanRun(runId, summary) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from(TABLES.scanRuns)
    .update({
      finished_at: new Date().toISOString(),
      companies_scanned: summary.companiesScanned ?? 0,
      job_boards_scanned: summary.jobBoardsScanned ?? 0,
      total_found: summary.totalFound ?? 0,
      filtered_title: summary.filteredTitle ?? 0,
      filtered_location: summary.filteredLocation ?? 0,
      filtered_salary: summary.filteredSalary ?? 0,
      filtered_content: summary.filteredContent ?? 0,
      duplicates_skipped: summary.duplicatesSkipped ?? 0,
      new_added: summary.newAdded ?? 0,
      errors: summary.errors ?? null,
      ok: summary.ok ?? true,
    })
    .eq('id', runId);
  if (error) throw new Error(`finishScanRun: ${error.message}`);
}

export async function persistScanResults({ offers, date, historyRows = [] }) {
  if (!isSupabaseConfigured()) return { jobsUpserted: 0, seenUpserted: 0 };
  const sb = getSupabaseAdmin();

  const jobRows = offers.map((o) => ({
    url: o.url,
    company: o.company,
    role: o.title,
    location: o.location || null,
    source: o.source || null,
    status: 'pending',
    first_seen: date,
    posted_at: offerPostedAtDate(o),
    updated_at: new Date().toISOString(),
  }));

  let jobsUpserted = 0;
  if (jobRows.length > 0) {
    const { error } = await sb.from(TABLES.jobs).upsert(jobRows, { onConflict: 'url', ignoreDuplicates: true });
    if (error) throw new Error(`jobs upsert: ${error.message}`);
    jobsUpserted = jobRows.length;
  }

  const seenRows = [
    ...offers.map((o) => ({
      url: o.url,
      first_seen: date,
      status: 'added',
      company: o.company,
      role: o.title,
      location: o.location || null,
      source: o.source || null,
    })),
    ...historyRows,
  ];

  let seenUpserted = 0;
  if (seenRows.length > 0) {
    const { error } = await sb.from(TABLES.seenUrls).upsert(seenRows, { onConflict: 'url', ignoreDuplicates: false });
    if (error) throw new Error(`seen_urls upsert: ${error.message}`);
    seenUpserted = seenRows.length;
  }

  return { jobsUpserted, seenUpserted };
}
