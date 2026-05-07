import React from 'react';
import { useNavigate } from 'react-router';
import { CalendarEvent } from './CalendarEventCard';
import { cn } from '../ui/utils';

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

  const getEventStyle = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-50 border-l-2 border-green-500';
      case 'upcoming':
        return 'bg-blue-50 border-l-2 border-blue-500';
      default:
        return 'bg-gray-50 border-l-2 border-gray-500';
    }
  };

  const getDotStyle = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDayClick = (day: MonthDay) => {
    const dateStr = formatDate(day.date);
    navigate(`/quan-ly-phien-hop?date=${dateStr}`);
  };

  const renderEventCard = (event: CalendarEvent) => (
    <div
      key={event.id}
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/phien-hop/${event.id}`);
      }}
      className={cn(
        'relative px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all hover:shadow-md mb-1.5',
        getEventStyle(event.status),
        event.status === 'ongoing' && 'animate-pulse-subtle'
      )}
    >
      {/* Status dot */}
      <div className={cn(
        'absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full',
        getDotStyle(event.status)
      )} />

      <div className="pl-3">
        <div className="font-semibold text-gray-900 leading-tight truncate mb-0.5">
          {event.title}
        </div>
        <div className="text-[10px] text-gray-600 leading-tight">
          {event.startTime} - {event.endTime}
        </div>
        {event.location && (
          <div className="text-[10px] text-gray-500 leading-tight truncate mt-0.5">
            {event.location}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header với tên các thứ */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="py-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
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
                        'text-sm font-semibold',
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                        day.isToday && 'w-7 h-7 flex items-center justify-center rounded-full bg-[#C8102E] text-white'
                      )}
                    >
                      {day.dayNumber}
                    </div>
                  </div>

                  {/* Event list with scroll */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {day.events.map((event) => renderEventCard(event))}
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
