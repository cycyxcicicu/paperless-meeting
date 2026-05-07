import React from 'react';
import { Search, Filter, Download, RefreshCw, Settings, X, Calendar } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuditToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  activeFiltersCount: number;
  onRefresh: () => void;
  onExport: () => void;
  onSettings: () => void;
}

export const AuditToolbar: React.FC<AuditToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  onRefresh,
  onExport,
  onSettings,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm theo người dùng, IP, đối tượng, hành động..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C8102E]/40 focus:ring-3 focus:ring-[#C8102E]/10 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-lg transition-all relative',
            showFilters
              ? 'bg-[#C8102E] text-white shadow-md'
              : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Bộ lọc</span>
          {activeFiltersCount > 0 && (
            <span className={cn(
              'w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center',
              showFilters ? 'bg-white text-[#C8102E]' : 'bg-[#C8102E] text-white'
            )}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Date Range Button */}
        <button className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="hidden sm:inline">Hôm nay</span>
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Actions */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <Download className="h-4 w-4 text-gray-500" />
          <span className="hidden sm:inline">Xuất file</span>
        </button>

        <button
          onClick={onRefresh}
          className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all group"
          title="Làm mới"
        >
          <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
        </button>

        <button
          onClick={onSettings}
          className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          title="Cài đặt"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
