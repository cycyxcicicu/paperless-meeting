import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '../ui/utils';

interface ExportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  variant = 'outline',
  className,
  children = 'Xuất Excel',
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2',
        variant === 'default'
          ? 'bg-[#16A34A] text-white hover:bg-[#15803D]'
          : 'bg-white text-[#16A34A] border border-[#16A34A] hover:bg-[#F0FDF4]',
        className
      )}
      {...props}
    >
      <Download className="h-4 w-4" />
      <span>{children}</span>
    </button>
  );
};
