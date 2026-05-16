import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { LucideIcon, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon?: LucideIcon;
  badge?: string;
  subItems?: { name: string; path: string; icon?: LucideIcon; badge?: string }[];
}

interface SidebarProps {
  title?: string;
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ title, items }) => {
  const location = useLocation();
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

  useEffect(() => {
    const currentPath = location.pathname;
    const pathsToExpand = items
      .filter(item => item.subItems && currentPath.startsWith(item.path))
      .map(item => item.path);
    
    setExpandedPaths(prev => {
      const newExpanded = new Set([...prev, ...pathsToExpand]);
      return Array.from(newExpanded);
    });
  }, [location.pathname, items]);

  // Find the best matching item for current path
  // Strategy: Find the longest path that matches the current location
  const getActiveItemPath = () => {
    const currentPath = location.pathname;

    const allPaths = items.flatMap(item => [
      { path: item.path },
      ...(item.subItems?.map(sub => ({ path: sub.path })) || [])
    ]);

    // First, try exact match
    const exactMatch = allPaths.find(item => item.path === currentPath);
    if (exactMatch) return exactMatch.path;

    // Then, find the longest matching path
    const matchingItems = allPaths.filter(item => currentPath.startsWith(item.path));
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
          <h2 className="text-xs heading text-gray-500 uppercase tracking-widest">
            {title}
          </h2>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === activeItemPath || item.subItems?.some(sub => sub.path === activeItemPath);
            const isExpanded = expandedPaths.includes(item.path);

            const itemContent = (
              <>
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
                    'px-2 py-0.5 rounded-md text-[10px] heading tabular-nums transition-all duration-200',
                    isActive
                      ? 'bg-[#C8102E] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  )}>
                    {item.badge}
                  </span>
                )}

                {item.subItems && (
                  <div className="ml-auto">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                )}

                {/* Hover background effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent transition-opacity duration-300 pointer-events-none" />
                )}

                {/* Active background */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-50 via-red-50/80 to-transparent opacity-100 -z-10" />
                )}
              </>
            );

            return (
              <div key={item.path} className="flex flex-col">
                {item.subItems ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setExpandedPaths(prev => 
                        prev.includes(item.path) ? prev.filter(p => p !== item.path) : [...prev, item.path]
                      );
                    }}
                    className={cn(
                      'w-full text-left group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm body transition-all duration-200',
                      isActive
                        ? 'text-[#C8102E]'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/80'
                    )}
                  >
                    {itemContent}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm body transition-all duration-200',
                      isActive
                        ? 'text-[#C8102E]'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/80'
                    )}
                  >
                    {itemContent}
                  </Link>
                )}

                {item.subItems && isExpanded && (
                  <div className="pl-9 mt-1 space-y-1">
                    {item.subItems.map(subItem => {
                      const SubIcon = subItem.icon;
                      const isSubActive = subItem.path === activeItemPath;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={cn(
                            'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm body transition-all duration-200',
                            isSubActive
                              ? 'text-[#C8102E]'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/80'
                          )}
                        >
                          {/* Active indicator */}
                          {isSubActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#C8102E] rounded-r-full" />
                          )}

                          {SubIcon && (
                            <div className={cn(
                              'relative flex items-center justify-center shrink-0 transition-all duration-200',
                              isSubActive 
                                ? 'text-[#C8102E]' 
                                : 'text-gray-400 group-hover:text-gray-600'
                            )}>
                              <SubIcon className="h-[16px] w-[16px]" strokeWidth={2} />
                            </div>
                          )}

                          <span className="flex-1 truncate relative z-10">
                            {subItem.name}
                          </span>

                          {/* Hover background effect */}
                          {!isSubActive && (
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent transition-opacity duration-300 pointer-events-none" />
                          )}

                          {/* Active background */}
                          {isSubActive && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-50 via-red-50/80 to-transparent opacity-100 -z-10" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer - Optional branding */}
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="body">Hệ thống hoạt động bình thường</span>
        </div>
      </div>
    </div>
  );
};

export { Sidebar };
export type { SidebarItem };
