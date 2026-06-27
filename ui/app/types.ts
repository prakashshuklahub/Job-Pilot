export type Job = {
  id: string;
  url: string;
  company: string;
  role: string;
  location: string | null;
  status: 'pending' | 'applied' | 'interview' | string;
  first_seen: string;
  posted_at: string | null;
  source: string | null;
};

export type ScanRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  trigger: string;
  new_added: number | null;
  duplicates_skipped: number | null;
  total_found: number | null;
  ok: boolean | null;
};

export type TabId = 'scan' | 'jobs';
