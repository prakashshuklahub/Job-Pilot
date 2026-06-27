'use client';

import { useState } from 'react';
import { JOB_STATUSES, isValidJobStatus, jobStatusLabel } from '@/lib/job-status';
import { formatPostedAt } from '@/lib/format-posted-at';
import type { Job } from '../types';
import { Pagination } from './Pagination';

export type CountryFilterOption = {
  id: string;
  label: string;
  primary?: boolean;
};

type JobsTabProps = {
  jobs: Job[];
  jobTotal: number;
  page: number;
  pageSize: number;
  loading: boolean;
  countryFilter: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  countryOptions: CountryFilterOption[];
  remoteCountryId: string;
  onCountryFilterChange: (countryId: string) => void;
  onStatusFilterChange: (status: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearDateFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onStatusUpdate: (jobId: string, status: string) => Promise<void>;
};

export function JobsTab({
  jobs,
  jobTotal,
  page,
  pageSize,
  loading,
  countryFilter,
  statusFilter,
  dateFrom,
  dateTo,
  countryOptions,
  remoteCountryId,
  onCountryFilterChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onClearDateFilters,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onStatusUpdate,
}: JobsTabProps) {
  const totalPages = Math.max(1, Math.ceil(jobTotal / pageSize));
  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const primaryCountries = countryOptions.filter((c) => c.primary);
  const secondaryCountries = countryOptions.filter((c) => !c.primary);

  async function handleStatusUpdate(job: Job) {
    const current = isValidJobStatus(job.status) ? job.status : 'pending';
    const next = draftStatus[job.id] ?? current;
    if (next === current) return;

    setUpdatingId(job.id);
    try {
      await onStatusUpdate(job.id, next);
      setDraftStatus((prev) => {
        const copy = { ...prev };
        delete copy[job.id];
        return copy;
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <div className="card toolbar">
        <button className="btn btn-secondary" type="button" onClick={onRefresh} disabled={loading}>
          Refresh list
        </button>
        <div className="muted toolbar-summary">
          <strong>{jobTotal}</strong> job{jobTotal === 1 ? '' : 's'}
          {countryFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo
            ? ' matching filters'
            : ' in Supabase inbox'}
        </div>
      </div>

      <div className="card filters-card">
        <div className="filters-grid">
          <div className="filters-row">
            <label className="filter-label" htmlFor="country-filter">
              Country
            </label>
            <select
              id="country-filter"
              className="filter-select"
              value={countryFilter}
              disabled={loading}
              onChange={(e) => onCountryFilterChange(e.target.value)}
            >
              <option value="all">All countries</option>
              <option value={remoteCountryId}>Remote / EU</option>
              {primaryCountries.length > 0 && (
                <optgroup label="Primary markets">
                  {primaryCountries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {secondaryCountries.length > 0 && (
                <optgroup label="Other EU markets">
                  {secondaryCountries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="filters-row">
            <label className="filter-label" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              className="filter-select"
              value={statusFilter}
              disabled={loading}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="all">All statuses</option>
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {jobStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="filters-row">
            <label className="filter-label" htmlFor="date-from">
              First seen from
            </label>
            <input
              id="date-from"
              type="date"
              className="filter-input"
              value={dateFrom}
              disabled={loading}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>

          <div className="filters-row">
            <label className="filter-label" htmlFor="date-to">
              First seen to
            </label>
            <input
              id="date-to"
              type="date"
              className="filter-input"
              value={dateTo}
              min={dateFrom || undefined}
              disabled={loading}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>

          {(dateFrom || dateTo) && (
            <div className="filters-row filters-row-action">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={onClearDateFilters}
              >
                Clear dates
              </button>
            </div>
          )}
        </div>
        <p className="muted filters-hint">
          Country uses location text from scan. Status and first-seen date filter the inbox in
          Supabase.
        </p>
      </div>

      <div className="card">
        <h2 className="section-title">Job inbox</h2>
        {loading ? (
          <p className="muted">Loading jobs…</p>
        ) : jobTotal === 0 ? (
          <p className="muted">
            No jobs for this filter. Try clearing filters, run a <strong>Scan</strong>, or loosen
            rules in <code>portals.yml</code>.
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Posted</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const current = isValidJobStatus(j.status) ? j.status : 'pending';
                    const selected = draftStatus[j.id] ?? current;
                    const dirty = selected !== current;
                    const saving = updatingId === j.id;

                    return (
                      <tr key={j.id}>
                        <td>{j.company}</td>
                        <td>{j.role}</td>
                        <td className="muted">{j.location || '—'}</td>
                        <td className="muted">{formatPostedAt(j.posted_at)}</td>
                        <td>
                          <div className="status-cell">
                            <select
                              className="status-select"
                              value={selected}
                              disabled={saving}
                              aria-label={`Status for ${j.company} ${j.role}`}
                              onChange={(e) =>
                                setDraftStatus((prev) => ({ ...prev, [j.id]: e.target.value }))
                              }
                            >
                              {JOB_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {jobStatusLabel(s)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={!dirty || saving}
                              onClick={() => handleStatusUpdate(j)}
                            >
                              {saving ? 'Saving…' : 'Update'}
                            </button>
                          </div>
                        </td>
                        <td className="muted">{j.source || '—'}</td>
                        <td>
                          <a href={j.url} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={jobTotal}
              pageSize={pageSize}
              loading={loading}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
      </div>
    </>
  );
}
