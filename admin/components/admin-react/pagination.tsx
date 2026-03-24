type AdminPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function buildPaginationButtons(currentPage: number, totalPages: number): number[] {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  pages.add(currentPage);
  pages.add(currentPage - 1);
  pages.add(currentPage + 1);
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = buildPaginationButtons(currentPage, totalPages);

  return (
    <div className="px-8 py-6 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30">
      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">
        Showing {start}-{end} of {totalItems} records
      </p>
      <div className="flex gap-2">
        <button
          className={`p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant ${
            currentPage <= 1 ? "opacity-40 pointer-events-none" : ""
          }`}
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="flex gap-1">
          {pages.map((page) => {
            const active = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={
                  active
                    ? "w-10 h-10 rounded-lg bg-primary text-on-primary font-bold text-sm"
                    : "w-10 h-10 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant text-sm"
                }
              >
                {page}
              </button>
            );
          })}
        </div>
        <button
          className={`p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant ${
            currentPage >= totalPages ? "opacity-40 pointer-events-none" : ""
          }`}
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

