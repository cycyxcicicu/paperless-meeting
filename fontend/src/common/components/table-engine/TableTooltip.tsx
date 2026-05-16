import React from 'react';

interface TableTooltipProps {
  text?: string | null;
  maxLength?: number;
  className?: string;
}

/**
 * Component hiển thị văn bản dài với cơ chế cắt bớt (truncate) và hiện Tooltip khi hover.
 * Được thiết kế để sử dụng trong các ô của DataTable.
 */
export const TableTooltip: React.FC<TableTooltipProps> = ({ 
  text, 
  maxLength = 40,
  className = "text-sm text-gray-600"
}) => {
  if (!text || text.length <= maxLength) {
    return <span className={className}>{text || '---'}</span>;
  }

  const truncated = text.substring(0, maxLength) + '...';

  return (
    <div className="relative group inline-block">
      <span className={`${className} cursor-help`}>
        {truncated}
      </span>
      {/* Custom Tooltip Container */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 min-w-[250px] max-w-[450px]">
        <div className="bg-white text-gray-800 text-xs rounded-xl shadow-xl border border-gray-200 p-3 leading-relaxed whitespace-normal animate-in fade-in zoom-in duration-200">
          {text}
          {/* Arrow */}
          <div className="absolute left-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
        </div>
      </div>
    </div>
  );
};
