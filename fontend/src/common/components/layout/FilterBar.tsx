import React from 'react';
import { cn } from '@/common/utils/cn';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 p-4 bg-white border border-[#E5E7EB] rounded-xl mb-6',
      className
    )}>
      {children}
    </div>
  );
};

export { FilterBar };
