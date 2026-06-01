import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
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

        {/* Legend container - 2 rows */}
        <div className="flex flex-col gap-1.5 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/80 min-w-[280px]">
          {/* Row 1: Meeting Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Đang họp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600">Sắp diễn ra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Kết thúc</span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gray-200 w-full"></div>
          
          {/* Row 2: Invite Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium">Đã xác nhận</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium">Chưa xác nhận</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-xs text-rose-500 font-medium">Từ chối</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
