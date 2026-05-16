import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  action?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  className,
  headerClassName,
  action
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("flex flex-col border-b border-gray-100 last:border-b-0", className)}>
      <div 
        className={cn(
          "flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50/50 transition-colors px-6",
          headerClassName
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 btn-primary text-gray-900 text-[15px]">
          {title}
        </div>
        <div className="flex items-center gap-3">
          {action && (
            <div onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
          <button 
            type="button" 
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
