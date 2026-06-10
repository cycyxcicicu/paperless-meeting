import React from 'react';
import { Link } from 'react-router';
import { cn } from '@/common/utils/cn';

interface PageHeaderProps {
  title?: string | React.ReactNode;
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
    <div className={cn('mb-6 flex flex-col gap-3.5', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const content = (
              <span
                className={cn(
                  'text-sm',
                  isLast
                    ? 'text-gray-900 btn-primary font-medium'
                    : 'text-gray-500 hover:text-gray-900 transition-colors'
                )}
              >
                {crumb.name}
              </span>
            );

            return (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-gray-300">/</span>}
                {crumb.path && !isLast ? (
                  <Link to={crumb.path} className="flex items-center">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            {title && (
              typeof title === 'string' ? (
                <h1 className="text-2xl font-bold text-gray-900 leading-tight heading">
                  {title}
                </h1>
              ) : (
                <div className="text-2xl font-bold text-gray-900 leading-tight heading">
                  {title}
                </div>
              )
            )}
            {description && (
              typeof description === 'string' ? (
                <p className="text-sm text-gray-500 body">
                  {description}
                </p>
              ) : (
                <div className="text-sm text-gray-500 body">
                  {description}
                </div>
              )
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { PageHeader };
