import React from 'react';
import { cn } from './utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ title, value, icon: Icon, trend, iconBgColor = 'bg-[#EFF6FF]', iconColor = 'text-[#2563EB]', className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[12px] bg-white border border-[#E5E7EB] p-6 shadow-sm transition-shadow hover:shadow-md',
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[#6B7280] mb-2">{title}</p>
            <p className="text-2xl font-semibold text-[#111827] mb-1">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-[#16A34A]' : 'text-[#EF4444]'
              )}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={cn('rounded-[10px] p-3', iconBgColor)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </div>
    );
  }
);

KPICard.displayName = 'KPICard';

export { KPICard };
