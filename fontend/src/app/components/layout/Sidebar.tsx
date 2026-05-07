import React from 'react';
import { Link, useLocation } from 'react-router';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { LucideIcon } from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon?: LucideIcon;
  badge?: string;
}

interface SidebarProps {
  title?: string;
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ title, items }) => {
  const location = useLocation();

  // Find the best matching item for current path
  // Strategy: Find the longest path that matches the current location
  const getActiveItemPath = () => {
    const currentPath = location.pathname;

    // First, try exact match
    const exactMatch = items.find(item => item.path === currentPath);
    if (exactMatch) return exactMatch.path;

    // Then, find the longest matching path
    const matchingItems = items.filter(item => currentPath.startsWith(item.path));
    if (matchingItems.length === 0) return null;

    // Sort by path length (descending) and return the longest
    const longestMatch = matchingItems.sort((a, b) => b.path.length - a.path.length)[0];
    return longestMatch.path;
  };

  const activeItemPath = getActiveItemPath();

  return (
    <div className="w-64 bg-white border-r border-gray-200/80 fixed left-0 top-16 bottom-0 z-40 flex flex-col">
      {/* Sidebar Header */}
      {title && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {title}
          </h2>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === activeItemPath;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-[#C8102E]'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/80'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#C8102E] rounded-r-full" />
                )}

                {/* Icon */}
                {Icon && (
                  <div className={cn(
                    'relative flex items-center justify-center shrink-0 transition-all duration-200',
                    isActive 
                      ? 'text-[#C8102E]' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  )}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </div>
                )}

                {/* Label */}
                <span className="flex-1 truncate">
                  {item.name}
                </span>

                {/* Badge */}
                {item.badge && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums transition-all duration-200',
                    isActive
                      ? 'bg-[#C8102E] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  )}>
                    {item.badge}
                  </span>
                )}

                {/* Hover background effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent transition-opacity duration-300 pointer-events-none" />
                )}

                {/* Active background */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-50 via-red-50/80 to-transparent opacity-100 -z-10" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer - Optional branding */}
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Hệ thống hoạt động bình thường</span>
        </div>
      </div>
    </div>
  );
};

export { Sidebar };
export type { SidebarItem };
