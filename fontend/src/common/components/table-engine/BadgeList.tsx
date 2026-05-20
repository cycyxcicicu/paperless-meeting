import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/common/components/ui/tooltip';

export interface BadgeItem {
  key: string;
  label: string;
}

interface BadgeListProps {
  items: BadgeItem[];
  maxVisible?: number;
  emptyText?: string;
  badgeClassName?: string;
}

/**
 * Component hiển thị danh sách badge với tooltip hover.
 * Dùng chung cho mọi trang cần hiển thị danh sách tag/badge trong bảng.
 * 
 * @example
 * <BadgeList items={permissions.map(p => ({ key: p, label: LABELS[p] }))} maxVisible={2} />
 */
export const BadgeList: React.FC<BadgeListProps> = ({
  items,
  maxVisible = 2,
  emptyText = 'Chưa gán',
  badgeClassName = 'bg-blue-50 text-blue-600 border-blue-100',
}) => {
  const visible = items.slice(0, maxVisible);
  const hidden = items.slice(maxVisible);

  return (
    <div className="flex flex-wrap gap-1 max-w-[220px]">
      {visible.map(item => (
        <span
          key={item.key}
          className={`inline-flex px-2 py-0.5 text-[10px] btn-primary rounded-md border ${badgeClassName}`}
        >
          {item.label}
        </span>
      ))}

      {hidden.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex px-2 py-0.5 text-[10px] btn-primary rounded-md bg-gray-50 text-gray-500 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                +{hidden.length}
              </span>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              showArrow={false}
              className="bg-white text-gray-800 border border-gray-200 p-2 shadow-xl rounded-xl max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 pointer-events-auto"
            >
              <div className="space-y-1 min-w-[180px]">
                {hidden.map(item => (
                  <div key={item.key} className="flex items-center gap-1.5 py-1 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    <span className="text-xs text-left leading-relaxed">{item.label}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {items.length === 0 && (
        <span className="text-xs text-gray-400 italic">{emptyText}</span>
      )}
    </div>
  );
};
