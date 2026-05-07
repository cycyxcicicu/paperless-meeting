import React from 'react';

export const CalendarLegend: React.FC = () => {
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
      <span className="text-sm font-medium text-gray-700">Chú thích:</span>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="text-sm text-gray-600">Đang họp</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <span className="text-sm text-gray-600">Sắp diễn ra</span>
      </div>
    </div>
  );
};
