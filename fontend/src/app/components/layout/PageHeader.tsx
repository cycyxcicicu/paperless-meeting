import React from 'react';
import { cn } from '../ui/utils';

interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { name: string; path?: string }[];
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}) => {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-[#D1D5DB]">/</span>}
              <span
                className={cn(
                  'text-xs',
                  index === breadcrumbs.length - 1
                    ? 'text-[#111827] font-medium'
                    : 'text-[#6B7280] hover:text-[#111827] cursor-pointer'
                )}
              >
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {typeof title === 'string' ? (
            <h1 className="text-[28px] font-semibold text-[#111827] leading-tight mb-1">
              {title}
            </h1>
          ) : (
            <div className="text-[28px] font-semibold text-[#111827] leading-tight mb-1">
              {title}
            </div>
          )}
          {description && (
            typeof description === 'string' ? (
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {description}
              </p>
            ) : (
              <div className="text-sm text-[#6B7280] leading-relaxed">
                {description}
              </div>
            )
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export { PageHeader };
