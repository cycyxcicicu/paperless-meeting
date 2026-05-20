import React from 'react';
import { Search, Filter, X, Download, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { CustomDropdown } from '@/common/components/ui/custom-dropdown';
import { FilterDef, BulkActionDef } from './table.types';

interface DataToolbarProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filters?: FilterDef[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, val: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  onResetFilters?: () => void;
  activeFiltersCount?: number;
  activeFilterTags?: Array<{ label: string; onRemove: () => void }>;
  
  // Actions
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onExport?: () => void;
  exportDisabled?: boolean;
  
  // Bulk Actions
  selectedIds?: (number | string)[];
  totalItems?: number;
  onSelectAll?: () => void;
  bulkActions?: BulkActionDef[];

  // Custom Actions
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

export const DataToolbar: React.FC<DataToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filters = [],
  filterValues = {},
  onFilterChange,
  showFilters = false,
  onToggleFilters,
  onResetFilters,
  activeFiltersCount = 0,
  activeFilterTags = [],
  onRefresh,
  isRefreshing,
  onExport,
  exportDisabled,
  selectedIds = [],
  totalItems = 0,
  onSelectAll,
  bulkActions = [],
  primaryAction,
}) => {
  const showSearch = searchQuery !== undefined && onSearchChange !== undefined;
  return (
    <div className="flex flex-col">
      {/* Main Toolbar */}
      <div className="p-6 border-b border-gray-200/60">
        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-11 pl-12 pr-4 text-sm bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition-all"
              />
            </div>
          )}
          {!showSearch && <div className="flex-1"></div>}

          {/* Action Buttons */}
          {filters.length > 0 && onToggleFilters && (
            <button
              onClick={onToggleFilters}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm body rounded-xl transition-all relative ${
                showFilters
                  ? 'bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white shadow-md'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs heading rounded-full flex items-center justify-center shadow-md">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {onExport && (
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={exportDisabled}
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
              Xuất file
            </Button>
          )}

          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white heading text-sm hover:shadow-lg transition-all shadow-md active:scale-95"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length === totalItems && totalItems > 0}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E] cursor-pointer"
              />
              <span className="text-sm body text-gray-900">
                Đã chọn {selectedIds.length} mục
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bulkActions.map((action) => {
                if (action.show && !action.show(selectedIds)) return null;
                
                let btnClass = "inline-flex items-center gap-2 px-3 py-1.5 text-sm body bg-white border rounded-lg transition-all ";
                if (action.variant === 'danger') {
                  btnClass += "text-red-700 border-red-300 hover:bg-red-50";
                } else if (action.variant === 'primary') {
                  btnClass += "text-blue-700 border-blue-300 hover:bg-blue-50";
                } else {
                  btnClass += "text-gray-700 border-gray-300 hover:bg-gray-50";
                }

                return (
                  <button 
                    key={action.key}
                    onClick={() => action.onClick(selectedIds)}
                    className={btnClass}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && filters.length > 0 && (
        <div className="px-6 py-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200/60">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <CustomDropdown
                  key={filter.key}
                  label={filter.label}
                  options={filter.options || []}
                  value={filterValues[filter.key] || filter.defaultValue || 'all'}
                  onChange={(val) => onFilterChange?.(filter.key, val)}
                  searchable={filter.type === 'searchable-select'}
                  searchPlaceholder={filter.searchPlaceholder}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Bộ lọc tự động áp dụng khi bạn thay đổi</p>
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm body text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                <X className="h-4 w-4" />
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-200/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs btn-primary text-gray-700">Bộ lọc đang áp dụng:</span>
            {activeFilterTags.map((tag, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-sm body text-gray-700 border border-gray-300 rounded-full shadow-sm"
              >
                <span>{tag.label}</span>
                <button
                  onClick={tag.onRemove}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={onResetFilters}
              className="text-xs btn-primary text-red-600 hover:text-red-700 underline ml-2"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
