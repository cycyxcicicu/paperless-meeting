import React from 'react';
import { Search, Plus, RefreshCw, Download } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PositionToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  onAddNew: () => void;
  onExport: () => void;
}

export const PositionToolbar: React.FC<PositionToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  onRefresh,
  onAddNew,
  onExport,
}) => {
  return (
    <div className="p-6 border-b border-gray-200/60 sticky top-0 z-20 backdrop-blur-sm bg-white/95">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-[#C8102E]" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên chức vụ, mã chức vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#C8102E]/50 focus:ring-4 focus:ring-[#C8102E]/5 focus:bg-white transition-all duration-300"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onExport}
            className="inline-flex items-center gap-2 h-12 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all group"
          >
            <Download className="h-4 w-4 text-gray-500 group-hover:translate-y-0.5 transition-transform" />
            <span>Xuất file</span>
          </button>

          <button 
            onClick={onRefresh}
            className="w-12 h-12 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all group active:scale-95"
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>

          <div className="w-[1px] h-8 bg-gray-200 mx-1" />

          <button 
            onClick={onAddNew}
            className="inline-flex items-center gap-2 h-12 px-6 py-2.5 bg-gradient-to-r from-[#C8102E] to-[#A90F14] text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-xl hover:translate-y-[-2px] transition-all active:scale-95 group"
          >
            <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="h-4 w-4" />
            </div>
            <span>Thêm chức vụ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
