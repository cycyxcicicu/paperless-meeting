import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '../ui/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
        {icon || <FileQuestion className="h-8 w-8 text-[#9CA3AF]" />}
      </div>
      <h3 className="text-base font-semibold text-[#111827] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#6B7280] max-w-md mb-6">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
};

export { EmptyState };
