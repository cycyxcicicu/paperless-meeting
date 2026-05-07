import React from 'react';
import { SearchX, MapPin, Plus, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface LocationEmptyStateProps {
  type?: 'search' | 'no-data';
  onReset?: () => void;
  onAdd?: () => void;
}

export const LocationEmptyState: React.FC<LocationEmptyStateProps> = ({
  type = 'no-data',
  onReset,
  onAdd,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
          {type === 'search' ? (
            <SearchX className="h-9 w-9 text-gray-300" />
          ) : (
            <MapPin className="h-9 w-9 text-gray-300" />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {type === 'search'
            ? 'Không tìm thấy địa điểm họp'
            : 'Chưa có địa điểm họp nào'}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
          {type === 'search'
            ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại để xem toàn bộ danh sách.'
            : 'Bắt đầu bằng cách thêm địa điểm họp đầu tiên vào hệ thống.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          {type === 'search' ? (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Đặt lại tìm kiếm
            </button>
          ) : (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8102E] text-white text-sm font-bold rounded-xl hover:bg-[#A90F14] shadow-lg shadow-red-200/50 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Thêm địa điểm ngay
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
