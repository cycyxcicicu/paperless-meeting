import React from 'react';

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string; // "người dùng", "đơn vị", "chức vụ", "bản ghi", etc.
}

/**
 * AppPagination - Component phân trang chuẩn cho toàn hệ thống
 * 
 * Thiết kế dựa trên pagination của trang "Quản lý người dùng"
 * để đảm bảo tính nhất quán UI/UX trên toàn bộ hệ thống
 * 
 * @example
 * ```tsx
 * <AppPagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   pageSize={pageSize}
 *   totalItems={totalItems}
 *   onPageChange={setCurrentPage}
 *   onPageSizeChange={(size) => {
 *     setPageSize(size);
 *     setCurrentPage(1);
 *   }}
 *   itemLabel="người dùng"
 * />
 * ```
 */
const AppPagination: React.FC<AppPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'bản ghi'
}) => {
  // Tính toán phạm vi hiển thị
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="px-6 py-4 border-t border-gray-200/60 bg-gray-50/30">
      <div className="flex items-center justify-between">
        {/* Left: Summary text */}
        <div className="text-sm text-gray-600">
          Hiển thị <span className="font-semibold text-gray-900">{startItem}</span> đến{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> trong tổng số{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> {itemLabel}
        </div>

        {/* Right: Pagination controls */}
        <div className="flex items-center gap-3">
          {/* Page navigation */}
          <div className="flex items-center gap-1">
            {/* Previous button */}
            {currentPage > 1 && (
              <button
                onClick={() => onPageChange(currentPage - 1)}
                className="w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
              >
                ‹
              </button>
            )}

            {/* Page numbers */}
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              
              // Show: first page, last page, and pages around current page
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white shadow-md'
                        : 'text-gray-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              } 
              // Show ellipsis
              else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-1 text-gray-400">
                    ...
                  </span>
                );
              }
              
              return null;
            })}

            {/* Next button */}
            {currentPage < totalPages && (
              <button
                onClick={() => onPageChange(currentPage + 1)}
                className="w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
              >
                ›
              </button>
            )}
          </div>

          {/* Page size selector */}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 pl-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 cursor-pointer transition-all"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export { AppPagination };
