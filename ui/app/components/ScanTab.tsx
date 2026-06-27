import type { ScanRun } from '../types';

type ScanTabProps = {
  runs: ScanRun[];
  runsLoading: boolean;
  scanning: boolean;
  scanLog: string;
  jobTotal: number;
  onScan: () => void;
  onRefresh: () => void;
};

export function ScanTab({
  runs,
  runsLoading,
  scanning,
  scanLog,
  jobTotal,
  onScan,
  onRefresh,
}: ScanTabProps) {
  const lastRun = runs[0];
  const today = new Date().toISOString().slice(0, 10);
  const addedToday = runs
    .filter((r) => r.started_at?.slice(0, 10) === today)
    .reduce((n, r) => n + (r.new_added ?? 0), 0);

  return (
    <>
      <div className="card toolbar">
        <button className="btn" type="button" onClick={onScan} disabled={scanning}>
          {scanning ? 'Scanning…' : 'Scan now'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onRefresh} disabled={runsLoading || scanning}>
          Refresh history
        </button>
        <div className="muted toolbar-summary">
          Cron: daily 06:00 UTC · Inbox total: <strong>{jobTotal}</strong>
          {lastRun && (
            <>
              {' '}
              · Last run: {new Date(lastRun.started_at).toLocaleString()} ({lastRun.trigger}) —{' '}
              <strong>{lastRun.new_added ?? 0} new</strong>
            </>
          )}
          {addedToday > 0 && (
            <>
              {' '}
              · Today: <strong>{addedToday}</strong> new
            </>
          )}
        </div>
      </div>

      {scanLog && (
        <div className="card">
          <h2 className="section-title">Scan output</h2>
          <pre className="scan-output scan-output-tall">{scanLog}</pre>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Recent scans</h2>
        {runsLoading ? (
          <p className="muted">Loading scan history…</p>
        ) : runs.length === 0 ? (
          <p className="muted">No scans yet. Click Scan now to pull jobs from your portals.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Trigger</th>
                  <th>New</th>
                  <th>Dupes</th>
                  <th>Found</th>
                  <th>OK</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.started_at).toLocaleString()}</td>
                    <td>{r.trigger}</td>
                    <td>{r.new_added ?? '—'}</td>
                    <td>{r.duplicates_skipped ?? '—'}</td>
                    <td>{r.total_found ?? '—'}</td>
                    <td>{r.ok === false ? '✗' : r.ok ? '✓' : '…'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
