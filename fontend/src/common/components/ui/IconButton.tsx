import React from 'react';
import { cn } from '@/common/utils/cn';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]',
    primary: 'bg-[#C8102E] text-white hover:bg-[#A90F14]',
    ghost: 'bg-transparent text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]',
  };

  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-11 w-11',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all',
        'focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
};
