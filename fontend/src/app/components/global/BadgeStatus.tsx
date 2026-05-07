import React from 'react';
import { cn } from '../ui/utils';

export type BadgeStatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'draft';

interface BadgeStatusProps {
  status: BadgeStatusType;
  label: string;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const BadgeStatus: React.FC<BadgeStatusProps> = ({
  status,
  label,
  dot = true,
  size = 'md',
  className,
}) => {
  const statusStyles = {
    success: 'bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC]',
    warning: 'bg-[#FFFBEB] text-[#F59E0B] border-[#FCD34D]',
    error: 'bg-[#FEF2F2] text-[#EF4444] border-[#FCA5A5]',
    info: 'bg-[#EFF6FF] text-[#3B82F6] border-[#93C5FD]',
    neutral: 'bg-[#F9FAFB] text-[#6B7280] border-[#D1D5DB]',
    draft: 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]',
  };

  const dotStyles = {
    success: 'bg-[#16A34A]',
    warning: 'bg-[#F59E0B]',
    error: 'bg-[#EF4444]',
    info: 'bg-[#3B82F6]',
    neutral: 'bg-[#6B7280]',
    draft: 'bg-[#9CA3AF]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-[12px]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        statusStyles[status],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[status])} />}
      {label}
    </span>
  );
};
