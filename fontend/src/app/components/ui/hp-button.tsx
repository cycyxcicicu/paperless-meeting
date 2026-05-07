import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[#C8102E] text-white hover:bg-[#A90F14] focus-visible:ring-[#C8102E]',
        secondary: 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] border border-[#E5E7EB] focus-visible:ring-[#6B7280]',
        outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-[#6B7280]',
        ghost: 'bg-transparent text-[#111827] hover:bg-[#F3F4F6] focus-visible:ring-[#6B7280]',
        danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] focus-visible:ring-[#EF4444]',
        success: 'bg-[#16A34A] text-white hover:bg-[#15803D] focus-visible:ring-[#16A34A]',
        link: 'text-[#C8102E] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
