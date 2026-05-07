import React from 'react';

interface ModernCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {(title || actions) && (
        <div className={`flex items-start justify-between border-b border-gray-100 ${padding === 'none' ? 'px-6 py-4' : paddingClasses[padding]} pb-4`}>
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className={title || actions ? '' : paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};

export { ModernCard };
