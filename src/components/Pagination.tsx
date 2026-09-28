import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  // Optional: lets the caller offer a "N per page" selector. Omit both to keep
  // existing pages (which don't support changing page size) unaffected.
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
  pageSizeOptions,
  onPageSizeChange,
}) => {
  const showPageSizeSelector = !!(
    pageSizeOptions &&
    pageSizeOptions.length &&
    onPageSizeChange
  );
  if (totalPages <= 1 && !showPageSizeSelector) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      {/* Items info - absolutely centered on the full bar width, independent of how
          wide the pagination controls on the right are */}

      <div>
        {showPageSizeSelector && (
          <label className="flex items-center gap-1.5 leading-none">
            <span className="hidden sm:inline">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange!(Number(e.target.value))}
              className="h-7 leading-none px-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
            >
              {pageSizeOptions!.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>per page</span>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600 dark:text-slate-400 justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
        <span className="leading-none">
          Showing{" "}
          <span className="font-medium text-slate-900 dark:text-white">
            {startItem}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-900 dark:text-white">
            {endItem}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900 dark:text-white">
            {totalItems}
          </span>{" "}
          results
        </span>
      </div>

      {/* Pagination controls - pinned to the right end of the bar */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border transition-colors ${
              currentPage === 1
                ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border transition-colors ${
              currentPage === 1
                ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => {
              if (pageNum === -1) {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-slate-400 dark:text-slate-600"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[2rem] h-8 px-3 text-sm rounded-lg border transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-500 border-blue-500 text-white font-medium"
                      : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border transition-colors ${
              currentPage === totalPages
                ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border transition-colors ${
              currentPage === totalPages
                ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
