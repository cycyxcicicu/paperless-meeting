import React from 'react';
import { SearchX, Briefcase, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  type?: 'search' | 'no-data';
  onReset?: () => void;
  onAdd?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type = 'no-data', 
  onReset, 
  onAdd 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center relative z-10 border border-gray-100 shadow-inner">
          {type === 'search' ? (
            <SearchX className="h-10 w-10 text-gray-300" />
          ) : (
            <Briefcase className="h-10 w-10 text-gray-300" />
          )}
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 animate-bounce shadow-sm">
          <span className="text-red-500 font-bold text-xl">?</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {type === 'search' ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu chức vụ'}
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 leading-relaxed">
          {type === 'search' 
            ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc để tìm thấy nội dung bạn cần.'
            : 'Hiện tại hệ thống chưa có thông tin chức vụ. Hãy bắt đầu bằng cách thêm mới một chức vụ.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          {type === 'search' ? (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Đặt lại tìm kiếm
            </button>
          ) : (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#C8102E] text-white text-sm font-bold rounded-xl hover:bg-[#A90F14] shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Thêm chức vụ ngay
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
