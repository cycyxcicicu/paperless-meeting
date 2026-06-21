import React from 'react';
import { TableEngineConfig } from './table.types';
import { Pagination } from '@/common/components/ui/app-pagination';

interface DataTableProps<T> {
  data: T[];
  config: TableEngineConfig<T>;
  
  // Selection (Optional)
  selectedIds?: (number | string)[];
  onToggleSelectAll?: () => void;
  onToggleSelectRow?: (id: number | string) => void;
  
  // Pagination (Optional)
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  
  // Loading & State
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  
  // Custom row key
  getRowId?: (row: T) => number | string;

  // Custom Rendering
  renderCustomRow?: (row: T, index: number) => React.ReactNode;
  containerClassName?: string;
}

export function DataTable<T>({
  data,
  config,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  itemLabel,
  isLoading = false,
  emptyMessage = "Không có dữ liệu",
  getRowId = (row: any) => row.id,
  renderCustomRow,
  containerClassName,
}: DataTableProps<T>) {
  
  const showSelection = selectedIds !== undefined && onToggleSelectAll && onToggleSelectRow;
  const showPagination = onPageChange && onPageSizeChange && totalItems > 0;
  const allSelected = data.length > 0 && selectedIds?.length === data.length;
  
  const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const renderPagination = () => (
    showPagination && (
      <Pagination
        currentPage={currentPage}
        totalPages={calculatedTotalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange!}
        onPageSizeChange={onPageSizeChange!}
        pageSizeOptions={pageSizeOptions}
        itemLabel={itemLabel}
      />
    )
  );

  if (renderCustomRow) {
    return (
      <div className="flex flex-col">
        {isLoading ? (
          <div className="px-6 py-10 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className={containerClassName}>
            {data.map((row, index) => renderCustomRow(row, index))}
          </div>
        )}
        {renderPagination()}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
              {showSelection && (
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                  />
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs heading text-gray-700 uppercase tracking-wider whitespace-nowrap">STT</th>
              
              {config.columns.map((col) => (
                <th 
                  key={col.key} 
                  className={`px-6 py-4 text-xs heading text-gray-700 uppercase tracking-wider whitespace-nowrap ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.headerClassName || ''}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}

              {config.rowActions && config.rowActions.length > 0 && (
                <th className="px-6 py-4 text-center text-xs heading text-gray-700 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={config.columns.length + (showSelection ? 2 : 1) + (config.rowActions ? 1 : 0)} className="px-6 py-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + (showSelection ? 2 : 1) + (config.rowActions ? 1 : 0)} className="px-6 py-10 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId(row) as number;
                const isSelected = selectedIds?.includes(rowId) || false;
                
                return (
                  <tr
                    key={rowId}
                    className={`transition-all hover:bg-blue-50/30 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    {showSelection && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectRow && onToggleSelectRow(rowId)}
                          className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm body text-gray-900">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    
                    {config.columns.map((col) => (
                      <td 
                        key={col.key} 
                        className={`px-6 py-4 text-sm text-gray-600 ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, index) : (row as any)[col.key]}
                      </td>
                    ))}

                    {config.rowActions && config.rowActions.length > 0 && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {config.rowActions.map((action) => {
                            if (action.show && !action.show(row)) return null;
                            
                            let btnClass = "w-9 h-9 flex items-center justify-center rounded-lg transition-all ";
                            if (action.variant === 'danger') {
                              btnClass += "text-gray-600 hover:bg-red-50 hover:text-red-600";
                            } else if (action.variant === 'primary') {
                              btnClass += "text-gray-600 hover:bg-blue-50 hover:text-blue-600";
                            } else if (action.variant === 'warning') {
                              btnClass += "text-gray-600 hover:bg-amber-50 hover:text-amber-600";
                            } else {
                              btnClass += "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
                            }

                            return (
                              <button
                                key={action.key}
                                onClick={() => action.onClick(row)}
                                className={btnClass}
                                title={action.label}
                              >
                                {action.icon}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}
    </div>
  );
}
