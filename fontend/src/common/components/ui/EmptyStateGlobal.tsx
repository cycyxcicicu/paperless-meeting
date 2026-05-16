import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-[#9CA3AF]" />
        </div>
      )}
      <h3 className="text-[16px] btn-primary text-[#111827] mb-2">{title}</h3>
      {description && (
        <p className="text-[13px] text-[#6B7280] max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
