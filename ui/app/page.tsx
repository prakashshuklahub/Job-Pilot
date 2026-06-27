'use client';

import { useCallback, useEffect, useState } from 'react';

type Job = {
  id: string;
  url: string;
  company: string;
  role: string;
  location: string | null;
  status: string;
  first_seen: string;
  source: string | null;
};

type ScanRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  trigger: string;
  new_added: number | null;
  duplicates_skipped: number | null;
  total_found: number | null;
  ok: boolean | null;
};

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [jobsRes, runsRes] = await Promise.all([
        fetch('/api/jobs?limit=300'),
        fetch('/api/scan-runs'),
      ]);
      const jobsJson = await jobsRes.json();
      const runsJson = await runsRes.json();
      if (!jobsRes.ok) throw new Error(jobsJson.error || 'Failed to load jobs');
      if (!runsRes.ok) throw new Error(runsJson.error || 'Failed to load scan runs');
      setJobs(jobsJson.jobs ?? []);
      setRuns(runsJson.runs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function runScan() {
    setScanning(true);
    setScanLog('Running scan… (may take 1–2 minutes)\n');
    setError('');
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const json = await res.json();
      setScanLog(json.tail || JSON.stringify(json, null, 2));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Scan failed (exit ${json.exitCode})`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  const lastRun = runs[0];
  const today = new Date().toISOString().slice(0, 10);
  const addedToday = runs
    .filter((r) => r.started_at?.slice(0, 10) === today)
    .reduce((n, r) => n + (r.new_added ?? 0), 0);

  return (
    <div className="container">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem' }}>Career-Ops</h1>
        <p className="muted" style={{ margin: 0 }}>
          Daily EU job inbox · same scan logic as <code>npm run scan</code>
        </p>
      </header>

      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <button className="btn" type="button" onClick={runScan} disabled={scanning}>
          {scanning ? 'Scanning…' : 'Scan now'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={refresh} disabled={loading}>
          Refresh
        </button>
        <div className="muted" style={{ fontSize: '0.9rem' }}>
          Cron: daily 06:00 UTC · Pending jobs: <strong>{jobs.length}</strong>
          {lastRun && (
            <>
              {' '}
              · Last scan: {new Date(lastRun.started_at).toLocaleString()} ({lastRun.trigger}) —{' '}
              <strong>{lastRun.new_added ?? 0} new</strong>
            </>
          )}
          {addedToday > 0 && <> · Today total new: <strong>{addedToday}</strong></>}
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {scanLog && <pre className="scan-output">{scanLog}</pre>}

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Recent scans</h2>
        {runs.length === 0 ? (
          <p className="muted">No scans yet. Run import script or click Scan now.</p>
        ) : (
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
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Job inbox</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="muted">
            No jobs in Supabase yet. Import existing pipeline or run a scan.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>First seen</th>
                  <th>Status</th>
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
        )}
      </div>
    </div>
  );
}
