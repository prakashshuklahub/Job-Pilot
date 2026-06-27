export type JobListFilters = {
  country: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

export function buildJobsQueryParams(
  pageIndex: number,
  limit: number,
  filters: JobListFilters,
): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(pageIndex * limit),
  });
  if (filters.country && filters.country !== 'all') params.set('country', filters.country);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  return params;
}

export function hasActiveJobFilters(filters: JobListFilters): boolean {
  return (
    filters.country !== 'all' ||
    filters.status !== 'all' ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo)
  );
}
