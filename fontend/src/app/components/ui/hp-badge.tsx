import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
        primary: 'bg-[#FEF2F2] text-[#C8102E] border border-[#FEE2E2]',
        success: 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]',
        warning: 'bg-[#FFFBEB] text-[#F59E0B] border border-[#FEF3C7]',
        error: 'bg-[#FEF2F2] text-[#EF4444] border border-[#FEE2E2]',
        info: 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
