import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../ui/utils';

interface NoResultStateProps {
  searchQuery?: string;
  title?: string;
  description?: string;
  onClear?: () => void;
  className?: string;
}

const NoResultState: React.FC<NoResultStateProps> = ({
  searchQuery,
  title = 'Không tìm thấy kết quả',
  description,
  onClear,
  className,
}) => {
  const defaultDescription = searchQuery 
    ? `Không tìm thấy kết quả phù hợp với "${searchQuery}"`
    : 'Không có dữ liệu phù hợp với bộ lọc đã chọn';

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-[#9CA3AF]" />
      </div>
      <h3 className="text-base font-semibold text-[#111827] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#6B7280] max-w-md mb-6">
        {description || defaultDescription}
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="text-sm text-[#C8102E] hover:text-[#A90F14] font-medium transition-colors"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

export { NoResultState };
