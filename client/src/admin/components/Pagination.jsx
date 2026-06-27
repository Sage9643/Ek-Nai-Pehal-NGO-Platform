export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-stone-500">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-forest transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {visiblePages.map((p, index) => {
          const prev = visiblePages[index - 1];
          const showEllipsis = prev && p - prev > 1;

          return (
            <span key={p} className="flex items-center gap-2">
              {showEllipsis && <span className="px-1 text-stone-400">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-10 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  p === page
                    ? 'bg-forest text-white'
                    : 'border border-stone-200 text-forest hover:bg-stone-50'
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-forest transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
