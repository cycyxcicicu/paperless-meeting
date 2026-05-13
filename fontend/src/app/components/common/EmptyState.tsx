import React from 'react';
import { LucideIcon, Search, FileText, Plus } from 'lucide-react';
import { Button } from '@/app/components/common/ui/Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  type?: 'search' | 'no-data' | 'default';
  onReset?: () => void;
  onAdd?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  type = 'default',
  onReset,
  onAdd,
}) => {
  let displayIcon = Icon;
  let displayTitle = title;
  let displayDescription = description;

  if (type === 'search') {
    displayIcon = displayIcon || Search;
    displayTitle = displayTitle || 'Không tìm thấy kết quả';
    displayDescription = displayDescription || 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.';
  } else if (type === 'no-data') {
    displayIcon = displayIcon || FileText;
    displayTitle = displayTitle || 'Chưa có dữ liệu';
    displayDescription = displayDescription || 'Hiện tại hệ thống chưa có dữ liệu nào được ghi nhận.';
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-gray-100',
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 shadow-sm border border-gray-50">
        {displayIcon ? (
          <displayIcon className="h-10 w-10 text-gray-300" />
        ) : (
          <FileText className="h-10 w-10 text-gray-300" />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{displayTitle || 'Không có dữ liệu'}</h3>
      
      {displayDescription && (
        <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">{displayDescription}</p>
      )}
      
      {action ? (
        <div>{action}</div>
      ) : (
        <div className="flex items-center gap-3">
          {type === 'search' && onReset && (
            <Button variant="outline" onClick={onReset} className="rounded-full px-6">
              Đặt lại tìm kiếm
            </Button>
          )}
          {type === 'no-data' && onAdd && (
            <Button variant="primary" onClick={onAdd} className="bg-[#C8102E] hover:bg-[#a80d26] rounded-full px-6 shadow-lg shadow-red-100">
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới ngay
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
