import React from 'react';
import { Search, Plus, RefreshCw, Download, Filter, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LocationToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  onAddNew: () => void;
  onExport: () => void;
}

export const LocationToolbar: React.FC<LocationToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  onRefresh,
  onAddNew,
  onExport,
}) => {
  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã phòng, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C8102E]/40 focus:ring-3 focus:ring-[#C8102E]/10 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 h-11 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          >
            <Download className="h-4 w-4 text-gray-500" />
            <span className="hidden sm:inline">Xuất file</span>
          </button>

          <button
            onClick={onRefresh}
            className="w-11 h-11 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 group"
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>

          <div className="w-px h-6 bg-gray-200" />

          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 h-11 px-5 bg-[#C8102E] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-[#A90F14] transition-all active:scale-95 group"
          >
            <div className="w-5 h-5 bg-white/15 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span>Thêm địa điểm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
