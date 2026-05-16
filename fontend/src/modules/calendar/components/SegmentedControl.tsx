import React from 'react';
import { cn } from '@/common/utils/cn';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-1 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-4 py-1.5 text-sm body rounded-md transition-all',
            value === option.value
              ? 'bg-white text-[#111827] shadow-sm'
              : 'text-[#6B7280] hover:text-[#111827]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
