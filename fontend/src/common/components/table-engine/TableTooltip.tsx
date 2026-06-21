import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/common/components/ui/tooltip';

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
  text: rawText, 
  maxLength = 40,
  className = "text-sm text-gray-600"
}) => {
  // Chuyển đổi dữ liệu phòng vệ tránh crash khi BE trả về Object, Number hoặc Null
  let text = '';
  if (rawText === null || rawText === undefined) {
    text = '---';
  } else if (typeof rawText === 'object') {
    const obj = rawText as any;
    text = obj.name || obj.title || obj.label || JSON.stringify(rawText);
  } else {
    text = String(rawText);
  }

  if (!text || text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }

  const truncated = text.substring(0, maxLength) + '...';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`${className} cursor-pointer`}>
          {truncated}
        </span>
      </TooltipTrigger>
      <TooltipContent 
        showArrow={true} 
        sideOffset={6}
        arrowClassName="fill-white bg-white"
        className="bg-white text-gray-900 border border-gray-200 px-3 py-2 rounded-lg shadow-md text-xs max-w-xs z-[9999] break-words"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
};
