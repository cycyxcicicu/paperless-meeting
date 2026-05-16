import React from 'react';

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
        <span className="relative group">
          <span className="inline-flex px-2 py-0.5 text-[10px] btn-primary rounded-md bg-gray-50 text-gray-500 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
            +{hidden.length}
          </span>
          {/* Tooltip */}
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 min-w-[180px]">
            <div className="bg-white text-gray-800 text-xs rounded-xl shadow-lg border border-gray-200 p-2.5 space-y-1">
              {hidden.map(item => (
                <div key={item.key} className="flex items-center gap-1.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  {item.label}
                </div>
              ))}
              <div className="absolute left-3 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
            </div>
          </div>
        </span>
      )}

      {items.length === 0 && (
        <span className="text-xs text-gray-400 italic">{emptyText}</span>
      )}
    </div>
  );
};
