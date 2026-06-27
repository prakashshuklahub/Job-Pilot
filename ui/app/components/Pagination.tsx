type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  loading = false,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageStart = total === 0 ? 0 : page * pageSize + 1;
  const pageEnd = Math.min((page + 1) * pageSize, total);

  function go(next: number) {
    onPageChange(Math.max(0, Math.min(next, totalPages - 1)));
  }

  return (
    <div className="pagination">
      <div className="pagination-meta">
        <span className="muted">
          Showing {pageStart}–{pageEnd} of {total}
        </span>
        {onPageSizeChange && (
          <label className="page-size">
            <span className="muted">Per page</span>
            <select
              value={pageSize}
              disabled={loading}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="pagination-controls">
        <button className="btn btn-secondary" type="button" disabled={page === 0 || loading} onClick={() => go(0)}>
          First
        </button>
        <button className="btn btn-secondary" type="button" disabled={page === 0 || loading} onClick={() => go(page - 1)}>
          Previous
        </button>
        <span className="muted page-indicator">
          Page {page + 1} / {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={page >= totalPages - 1 || loading}
          onClick={() => go(page + 1)}
        >
          Next
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={page >= totalPages - 1 || loading}
          onClick={() => go(totalPages - 1)}
        >
          Last
        </button>
      </div>
    </div>
  );
}
