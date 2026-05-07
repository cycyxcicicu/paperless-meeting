import React from 'react';
import { CalendarEvent, CalendarEventCard } from './CalendarEventCard';
import { cn } from '../ui/utils';

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthNumber: number;
  isHighlight?: boolean;
  events: CalendarEvent[];
}

interface WeekCalendarViewProps {
  weekDays: WeekDay[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (day: WeekDay) => void;
}

export const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
  weekDays,
  onEventClick,
  onDayClick,
}) => {
  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header với tên các ngày */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'p-4 text-center border-r border-gray-200 last:border-r-0',
                day.isHighlight && 'bg-red-50'
              )}
            >
              <div className="text-xs text-gray-600 mb-1">{day.dayName}</div>
              <div className="text-sm font-semibold text-gray-900">
                {day.dayNumber}/{day.monthNumber}
              </div>
            </div>
          ))}
        </div>

        {/* Grid lịch với các event */}
        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'p-3 border-r border-gray-200 last:border-r-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
                day.isHighlight && 'bg-red-50/50'
              )}
            >
              <div className="space-y-2">
                {day.events.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export type { WeekDay };
