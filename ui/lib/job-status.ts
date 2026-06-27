/** Matches career_ops_jobs.status check in supabase/schema.sql */
export const JOB_STATUSES = ['pending', 'applied', 'interview'] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  applied: 'Applied',
  interview: 'Interview',
};

export function isValidJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUSES as readonly string[]).includes(value);
}

export function jobStatusLabel(status: string): string {
  if (isValidJobStatus(status)) return STATUS_LABELS[status];
  return status;
}
