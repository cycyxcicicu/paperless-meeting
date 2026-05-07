import React from 'react';
import { useNavigate } from 'react-router';
import { cn } from '../ui/utils';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'ongoing' | 'upcoming';
  location?: string;
  participants?: number;
  colSpan?: number;
  isMultiDay?: boolean;
  originalStartTime?: string;
  originalEndTime?: string;
}

interface CalendarEventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/phien-hop/${event.id}`);
  };

  const statusStyles = {
    ongoing: 'bg-green-50 border-green-500',
    upcoming: 'bg-blue-50 border-blue-500',
  };

  const dotStyles = {
    ongoing: 'bg-green-500',
    upcoming: 'bg-blue-500',
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative px-3 py-2 rounded-xl border-l-2 cursor-pointer transition-all hover:shadow-md',
        statusStyles[event.status],
        event.status === 'ongoing' && 'animate-pulse-subtle'
      )}
    >
      {/* Status dot */}
      <div className={cn(
        'absolute top-2 left-2 w-2 h-2 rounded-full',
        dotStyles[event.status]
      )} />

      <div className="pl-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
          {event.title}
          {event.isMultiDay && (
            <span className="ml-1 text-xs opacity-60">↔</span>
          )}
        </h4>
        <p className="text-xs text-gray-600 mb-1">
          {event.startTime} - {event.endTime}
        </p>
        {event.location && (
          <p className="text-xs text-gray-500 truncate">{event.location}</p>
        )}
      </div>
    </div>
  );
};
