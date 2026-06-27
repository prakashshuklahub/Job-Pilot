/** Display employer publish date from career_ops_jobs.posted_at (YYYY-MM-DD). */
export function formatPostedAt(postedAt: string | null | undefined): string {
  if (!postedAt) return 'not available';
  return postedAt;
}
