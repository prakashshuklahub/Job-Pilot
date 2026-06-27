'use client';

import { useCallback, useEffect, useState } from 'react';
import { JobsTab } from './components/JobsTab';
import { ScanTab } from './components/ScanTab';
import type { Job, ScanRun, TabId } from './types';

const DEFAULT_PAGE_SIZE = 25;

export default function DashboardPage() {
  const [tab, setTab] = useState<TabId>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobTotal, setJobTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState('');
  const [error, setError] = useState('');

  const loadJobs = useCallback(async (pageIndex: number, limit: number) => {
    setJobsLoading(true);
    setError('');
    try {
      const offset = pageIndex * limit;
      const res = await fetch(`/api/jobs?limit=${limit}&offset=${offset}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load jobs');
      setJobs(json.jobs ?? []);
      setJobTotal(json.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const res = await fetch('/api/scan-runs');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load scan runs');
      setRuns(json.runs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scan history');
    } finally {
      setRunsLoading(false);
    }
  }, []);

  const refreshJobTotal = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs?limit=1&offset=0');
      const json = await res.json();
      if (res.ok) setJobTotal(json.total ?? 0);
    } catch {
      /* badge count is non-critical */
    }
  }, []);

  useEffect(() => {
    loadRuns();
    refreshJobTotal();
  }, [loadRuns, refreshJobTotal]);

  useEffect(() => {
    if (tab === 'jobs') {
      loadJobs(page, pageSize);
    }
  }, [tab, page, pageSize, loadJobs]);

  async function runScan() {
    setTab('scan');
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
      await Promise.all([loadRuns(), loadJobs(0, pageSize)]);
      setPage(0);
      setTab('jobs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(0);
  }

  async function updateJobStatus(jobId: string, status: string) {
    setError('');
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      const message = json.error || 'Failed to update status';
      setError(message);
      throw new Error(message);
    }
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  }

  return (
    <div className="container">
      <header className="app-header">
        <div>
          <h1>Career-Ops</h1>
          <p className="muted">Shared Supabase inbox · same jobs locally and on Vercel</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
        >
          Log out
        </button>
      </header>

      <nav className="tabs" aria-label="Dashboard sections">
        <button
          type="button"
          className={`tab ${tab === 'jobs' ? 'tab-active' : ''}`}
          onClick={() => setTab('jobs')}
        >
          Jobs
          {jobTotal > 0 && <span className="tab-badge">{jobTotal}</span>}
        </button>
        <button
          type="button"
          className={`tab ${tab === 'scan' ? 'tab-active' : ''}`}
          onClick={() => setTab('scan')}
        >
          Scan
          {scanning && <span className="tab-badge tab-badge-live">…</span>}
        </button>
      </nav>

      {error && (
        <div className="card card-error" role="alert">
          {error}
        </div>
      )}

      {tab === 'scan' ? (
        <ScanTab
          runs={runs}
          runsLoading={runsLoading}
          scanning={scanning}
          scanLog={scanLog}
          jobTotal={jobTotal}
          onScan={runScan}
          onRefresh={loadRuns}
        />
      ) : (
        <JobsTab
          jobs={jobs}
          jobTotal={jobTotal}
          page={page}
          pageSize={pageSize}
          loading={jobsLoading}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={() => loadJobs(page, pageSize)}
          onStatusUpdate={updateJobStatus}
        />
      )}
    </div>
  );
}
