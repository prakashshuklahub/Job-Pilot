/**
 * Shared posting-date recency helpers for scan.mjs and scan-ats-full.mjs.
 *
 * When recency_filter is enabled, jobs with postedAt older than the window are
 * dropped. Jobs without postedAt pass by default (undated: pass).
 */

/** @typedef {'stale' | 'undated' | 'keep'} PostingDateClass */

/**
 * @param {{ postedAt?: number | null }} job
 * @param {number} cutoff - epoch ms; postings before this are stale
 * @returns {PostingDateClass}
 */
export function classifyPostingDate(job, cutoff) {
  if (job.postedAt && job.postedAt < cutoff) return 'stale';
  if (!job.postedAt) return 'undated';
  return 'keep';
}

/**
 * @param {Record<string, unknown> | null | undefined} config - portals.yml root
 * @param {string[]} [argv]
 * @returns {{ maxAgeMs: number, undated: 'pass' | 'reject' } | null}
 */
export function resolveRecencyOptions(config, argv = []) {
  const rf = config?.recency_filter;
  /** @type {number | null} */
  let maxAgeMs = null;

  const hoursIdx = argv.indexOf('--max-age-hours');
  if (hoursIdx !== -1) {
    const v = Number(argv[hoursIdx + 1]);
    if (Number.isFinite(v) && v > 0) maxAgeMs = v * 3_600_000;
  }
  const sinceIdx = argv.indexOf('--since');
  if (sinceIdx !== -1) {
    const v = Number(argv[sinceIdx + 1]);
    if (Number.isFinite(v) && v > 0) maxAgeMs = v * 86_400_000;
  }
  if (maxAgeMs == null && process.env.SCAN_MAX_AGE_HOURS) {
    const v = Number(process.env.SCAN_MAX_AGE_HOURS);
    if (Number.isFinite(v) && v > 0) maxAgeMs = v * 3_600_000;
  }
  if (maxAgeMs == null && rf && typeof rf === 'object') {
    if (rf.max_age_hours != null) {
      const v = Number(rf.max_age_hours);
      if (Number.isFinite(v) && v > 0) maxAgeMs = v * 3_600_000;
    } else if (rf.max_age_days != null) {
      const v = Number(rf.max_age_days);
      if (Number.isFinite(v) && v > 0) maxAgeMs = v * 86_400_000;
    }
  }
  if (!maxAgeMs) return null;

  const undated = rf && typeof rf === 'object' && rf.undated === 'reject' ? 'reject' : 'pass';
  return { maxAgeMs, undated };
}

/**
 * @param {Record<string, unknown> | null | undefined} config
 * @param {string[]} [argv]
 * @returns {(job: { postedAt?: number | null }) => boolean}
 */
export function buildRecencyFilter(config, argv = []) {
  const options = resolveRecencyOptions(config, argv);
  if (!options) return () => true;

  const cutoff = Date.now() - options.maxAgeMs;
  const keepUndated = options.undated !== 'reject';
  return (job) => {
    const dateClass = classifyPostingDate(job, cutoff);
    if (dateClass === 'stale') return false;
    if (dateClass === 'undated') return keepUndated;
    return true;
  };
}

/**
 * Human-readable label for scan summary lines.
 * @param {Record<string, unknown> | null | undefined} config
 * @param {string[]} [argv]
 */
export function recencyFilterLabel(config, argv = []) {
  const options = resolveRecencyOptions(config, argv);
  if (!options) return null;
  const hours = Math.round(options.maxAgeMs / 3_600_000);
  const undatedNote = options.undated === 'reject' ? ', undated rejected' : ', undated kept';
  if (hours < 48 && options.maxAgeMs % 86_400_000 !== 0) {
    return `last ${hours}h${undatedNote}`;
  }
  const days = Math.round(options.maxAgeMs / 86_400_000);
  return `last ${days}d${undatedNote}`;
}
