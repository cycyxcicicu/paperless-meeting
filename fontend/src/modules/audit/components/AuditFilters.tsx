import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface AuditFiltersProps {
  show: boolean;
  selectedAction: string;
  setSelectedAction: (action: string) => void;
  selectedObjectType: string;
  setSelectedObjectType: (type: string) => void;
  onClearFilters: () => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  show,
  selectedAction,
  setSelectedAction,
  selectedObjectType,
  setSelectedObjectType,
  onClearFilters,
}) => {
  const actionTypes: FilterOption[] = [
    { label: 'Tất cả hành động', value: 'all', count: 245 },
    { label: 'Tạo mới', value: 'create', count: 87 },
    { label: 'Cập nhật', value: 'update', count: 112 },
    { label: 'Xóa', value: 'delete', count: 23 },
    { label: 'Xem', value: 'read', count: 23 },
  ];

  const objectTypes: FilterOption[] = [
    { label: 'Tất cả đối tượng', value: 'all', count: 245 },
    { label: 'Người dùng', value: 'user', count: 65 },
    { label: 'Cuộc họp', value: 'meeting', count: 89 },
    { label: 'Tài liệu', value: 'document', count: 54 },
    { label: 'Phòng họp', value: 'room', count: 37 },
  ];

  const hasActiveFilters = selectedAction !== 'all' || selectedObjectType !== 'all';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-gray-200 bg-gray-50/50"
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm heading text-gray-900">Bộ lọc nâng cao</h3>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-xs btn-primary text-[#C8102E] hover:text-[#A90F14] transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Action Type Filter */}
              <div>
                <label className="block text-xs heading text-gray-600 uppercase tracking-wider mb-2">
                  Loại hành động
                </label>
                <div className="flex flex-wrap gap-2">
                  {actionTypes.map((action) => (
                    <button
                      key={action.value}
                      onClick={() => setSelectedAction(action.value)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 text-xs btn-primary rounded-lg border transition-all',
                        selectedAction === action.value
                          ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <span>{action.label}</span>
                      {action.count !== undefined && (
                        <span className={cn(
                          'px-1.5 py-0.5 text-[10px] heading rounded',
                          selectedAction === action.value
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {action.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Object Type Filter */}
              <div>
                <label className="block text-xs heading text-gray-600 uppercase tracking-wider mb-2">
                  Loại đối tượng
                </label>
                <div className="flex flex-wrap gap-2">
                  {objectTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedObjectType(type.value)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 text-xs btn-primary rounded-lg border transition-all',
                        selectedObjectType === type.value
                          ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <span>{type.label}</span>
                      {type.count !== undefined && (
                        <span className={cn(
                          'px-1.5 py-0.5 text-[10px] heading rounded',
                          selectedObjectType === type.value
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {type.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
