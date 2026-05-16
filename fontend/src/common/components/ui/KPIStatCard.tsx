import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  color?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  className,
}) => {
  const colorStyles = {
    primary: {
      bg: 'bg-[#FEF2F2]',
      icon: 'text-[#C8102E]',
      value: 'text-[#111827]',
    },
    success: {
      bg: 'bg-[#F0FDF4]',
      icon: 'text-[#16A34A]',
      value: 'text-[#111827]',
    },
    warning: {
      bg: 'bg-[#FFFBEB]',
      icon: 'text-[#F59E0B]',
      value: 'text-[#111827]',
    },
    info: {
      bg: 'bg-[#EFF6FF]',
      icon: 'text-[#3B82F6]',
      value: 'text-[#111827]',
    },
  };

  const style = colorStyles[color];

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] text-[#6B7280] body mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={cn('text-[28px] btn-primary leading-none', style.value)}>
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  'text-[12px] body',
                  trend.direction === 'up' ? 'text-[#16A34A]' : 'text-[#EF4444]'
                )}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[12px] text-[#9CA3AF] mt-2">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', style.bg)}>
            <Icon className={cn('h-6 w-6', style.icon)} />
          </div>
        )}
      </div>
    </div>
  );
};
