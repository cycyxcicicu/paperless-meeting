import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ModernPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

const ModernPageHeader: React.FC<ModernPageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions
}) => {
  return (
    <div className="bg-gradient-to-r from-white to-gray-50/50 border-b border-gray-200/60 px-8 py-6 mb-6 rounded-xl shadow-sm">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-3">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-sm text-gray-600 hover:text-[#C8102E] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm text-gray-900 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 ml-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export { ModernPageHeader };
