import React from 'react';
import { cn } from '@/common/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  /** 
   * Cỡ chữ của giá trị (value). 
   * Có thể dùng: 'sm' | 'md' | 'lg' | 'xl' | '2xl' 
   * Hoặc class Tailwind: 'text-2xl', hoặc giá trị css: '24px'
   */
  valueSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
  hasFilters?: boolean;
  description?: string;
  className?: string;
}

const colorMap: Record<string, any> = {
  blue: {
    bg: 'from-blue-50 to-blue-100',
    text: 'text-blue-600',
    valueText: 'text-gray-900',
  },
  emerald: {
    bg: 'from-emerald-50 to-emerald-100',
    text: 'text-emerald-600',
    valueText: 'text-emerald-600',
  },
  purple: {
    bg: 'from-purple-50 to-purple-100',
    text: 'text-purple-600',
    valueText: 'text-purple-600',
  },
  amber: {
    bg: 'from-amber-50 to-amber-100',
    text: 'text-amber-600',
    valueText: 'text-amber-600',
  },
  rose: {
    bg: 'from-rose-50 to-rose-100',
    text: 'text-rose-600',
    valueText: 'text-rose-600',
  },
  gray: {
    bg: 'from-gray-50 to-gray-100',
    text: 'text-gray-500',
    valueText: 'text-gray-900',
  }
};

const sizeMap: Record<string, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  valueSize = 'xl',
  hasFilters = false,
  description,
  className
}) => {
  // Kiểm tra xem color có nằm trong danh sách định nghĩa sẵn không
  const isPredefinedColor = color in colorMap;
  const colorConfig = isPredefinedColor ? colorMap[color] : null;

  // Kiểm tra xem size có nằm trong danh sách định nghĩa sẵn không
  const isPredefinedSize = valueSize in sizeMap;
  const sizeClass = isPredefinedSize ? sizeMap[valueSize] : (valueSize.startsWith('text-') ? valueSize : '');

  // Style cho trường hợp dùng mã màu tùy chỉnh
  const customBgStyle = !isPredefinedColor ? { backgroundColor: `${color}15` } : {}; 
  const customTextStyle = !isPredefinedColor ? { color: color } : {};
  const customSizeStyle = !isPredefinedSize && !valueSize.startsWith('text-') ? { fontSize: valueSize } : {};

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-all",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
            {title}
            {hasFilters && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                Đã lọc
              </span>
            )}
          </p>
          <p className={cn(
            "heading truncate", 
            sizeClass,
            isPredefinedColor ? colorConfig.valueText : "text-gray-900"
          )}
          style={{
            ...(!isPredefinedColor && color === '#C8102E' ? { color: color } : {}),
            ...customSizeStyle
          }}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {description}
            </p>
          )}
        </div>
        <div 
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-4",
            isPredefinedColor ? `bg-gradient-to-br ${colorConfig.bg}` : ""
          )}
          style={customBgStyle}
        >
          {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, {
            className: cn(
              (icon.props as any).className, 
              isPredefinedColor ? colorConfig.text : ""
            ),
            style: customTextStyle
          })}
        </div>
      </div>
    </div>
  );
};
