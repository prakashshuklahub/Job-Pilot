'use client';

import { useState } from 'react';
import { JOB_STATUSES, isValidJobStatus, jobStatusLabel } from '@/lib/job-status';
import type { Job } from '../types';
import { Pagination } from './Pagination';

type JobsTabProps = {
  jobs: Job[];
  jobTotal: number;
  page: number;
  pageSize: number;
  loading: boolean;
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
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onStatusUpdate,
}: JobsTabProps) {
  const totalPages = Math.max(1, Math.ceil(jobTotal / pageSize));
  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function getDraftStatus(job: Job) {
    const current = isValidJobStatus(job.status) ? job.status : 'pending';
    return draftStatus[job.id] ?? current;
  }

  async function handleStatusUpdate(job: Job) {
    const next = getDraftStatus(job);
    const current = isValidJobStatus(job.status) ? job.status : 'pending';
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
          <strong>{jobTotal}</strong> job{jobTotal === 1 ? '' : 's'} in Supabase inbox
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Job inbox</h2>
        {loading ? (
          <p className="muted">Loading jobs…</p>
        ) : jobTotal === 0 ? (
          <p className="muted">
            No jobs yet. Open the <strong>Scan</strong> tab and run a scan, or run{' '}
            <code>npm run scan</code> from the repo root.
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
                    <th>First seen</th>
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
                        <td>{j.first_seen}</td>
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
