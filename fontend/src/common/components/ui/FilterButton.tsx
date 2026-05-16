import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  active = false,
  count,
  className,
  children = 'Bộ lọc',
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-[13px] body transition-all',
        'focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2',
        active
          ? 'bg-[#C8102E] text-white border-[#C8102E]'
          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#C8102E] hover:text-[#C8102E]',
        className
      )}
      {...props}
    >
      <Filter className="h-4 w-4" />
      <span>{children}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'min-w-[20px] h-5 px-1.5 rounded-full text-[11px] btn-primary flex items-center justify-center',
            active ? 'bg-white text-[#C8102E]' : 'bg-[#C8102E] text-white'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};
