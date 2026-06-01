import React from 'react';
import { useNavigate } from 'react-router';
import { CalendarEvent, CalendarEventCard } from './CalendarEventCard';
import { cn } from '@/common/utils/cn';

interface MonthDay {
  date: Date;
  dayNumber: number;
  month: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  events: CalendarEvent[];
}

interface MultiDayEvent extends CalendarEvent {
  startDate: Date;
  endDate: Date;
  displayStart?: boolean;
  displayEnd?: boolean;
  colSpan?: number;
}

interface MonthCalendarViewProps {
  monthDays: MonthDay[][];
  multiDayEvents?: MultiDayEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (day: MonthDay) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  monthDays,
  multiDayEvents = [],
  onEventClick,
  onDayClick,
}) => {
  const navigate = useNavigate();
  const weekDays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header với tên các thứ */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="py-3 text-center text-sm body text-gray-600 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid lịch tháng */}
      <div className="grid grid-rows-[repeat(auto-fit,minmax(140px,1fr))]">
        {monthDays.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
            {week.map((day, dayIndex) => {
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    'min-h-[140px] p-2 border-r border-gray-200 last:border-r-0 flex flex-col',
                    !day.isCurrentMonth && 'bg-gray-50/50'
                  )}
                >
                  {/* Số ngày */}
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <div
                      className={cn(
                        'text-sm btn-primary',
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                        day.isToday && 'w-7 h-7 flex items-center justify-center rounded-full bg-[#C8102E] text-white'
                      )}
                    >
                      {day.dayNumber}
                    </div>
                  </div>

                  {/* Event list with scroll */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-1">
                    {day.events.map((event) => (
                      <CalendarEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export type { MonthDay, MultiDayEvent };
