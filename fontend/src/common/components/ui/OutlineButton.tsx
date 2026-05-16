import React from 'react';
import { cn } from '@/common/utils/cn';

interface OutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    primary: 'border-[#C8102E] text-[#C8102E] hover:bg-[#FEF2F2]',
    secondary: 'border-[#6B7280] text-[#6B7280] hover:bg-[#F9FAFB]',
    success: 'border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4]',
    danger: 'border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-[12px]',
    md: 'h-10 px-4 text-[13px]',
    lg: 'h-11 px-6 text-[14px]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border bg-white body transition-all',
        'focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
