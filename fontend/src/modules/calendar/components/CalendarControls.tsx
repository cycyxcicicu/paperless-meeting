import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl';

interface CalendarControlsProps {
  dateRangeLabel: string;
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  dateRangeLabel,
  viewMode,
  onViewModeChange,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrevious}
          className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-base btn-primary text-[#111827] min-w-[200px] text-center">
          {dateRangeLabel}
        </div>

        <button
          onClick={onNext}
          className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* View mode toggle and legend */}
      <div className="flex items-center gap-4">
        <SegmentedControl
          options={[
            { value: 'week', label: 'Tuần' },
            { value: 'month', label: 'Tháng' },
          ]}
          value={viewMode}
          onChange={(value) => onViewModeChange(value as 'week' | 'month')}
        />

        {/* Legend inline */}
        <div className="flex items-center gap-4 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-700">Đang họp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-700">Sắp diễn ra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-700">Kết thúc</span>
          </div>
        </div>
      </div>
    </div>
  );
};
