import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/hp-button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã xảy ra lỗi',
  description = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-[#EF4444]" />
      </div>
      <h3 className="text-base font-semibold text-[#111827] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#6B7280] max-w-md mb-6">
        {description}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
};

export { ErrorState };
