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
}: JobsTabProps) {
  const totalPages = Math.max(1, Math.ceil(jobTotal / pageSize));

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
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>{j.company}</td>
                      <td>{j.role}</td>
                      <td className="muted">{j.location || '—'}</td>
                      <td>{j.first_seen}</td>
                      <td>
                        <span className="badge">{j.status}</span>
                      </td>
                      <td className="muted">{j.source || '—'}</td>
                      <td>
                        <a href={j.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
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
