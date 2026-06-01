import React from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/common/utils/cn';
import { Clock, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/common/components/ui/tooltip';
import { meetingApi } from '@/modules/meeting/services/meeting.api';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'ongoing' | 'upcoming' | 'finished';
  location?: string;
  participants?: number;
  colSpan?: number;
  isMultiDay?: boolean;
  originalStartTime?: string;
  originalEndTime?: string;
  inviteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  chairName?: string;
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
  const [open, setOpen] = React.useState(false);

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/phien-hop/${event.id}`);
  };

  const statusStyles = {
    ongoing: 'bg-green-50 border-green-500 text-green-700',
    upcoming: 'bg-blue-50 border-blue-500 text-blue-700',
    finished: 'bg-red-50 border-red-500 text-red-700',
  };

  const dotStyles = {
    ongoing: 'bg-green-500',
    upcoming: 'bg-blue-500',
    finished: 'bg-red-500',
  };

  const renderTooltipContent = () => {
    return (
      <div className="space-y-1.5 text-xs text-gray-700 font-normal">
        <p className="font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-1 text-sm">{event.title}</p>
        <p className="flex items-start gap-1.5">
          <span className="font-medium text-gray-900 shrink-0">📍 Địa điểm:</span>
          <span>{event.location || 'Chưa xác định'}</span>
        </p>
        <p className="flex items-start gap-1.5">
          <span className="font-medium text-gray-900 shrink-0">🕒 Thời gian:</span>
          <span>{event.startTime} - {event.endTime}</span>
        </p>
        <p className="flex items-start gap-1.5">
          <span className="font-medium text-gray-900 shrink-0">👤 Chủ trì:</span>
          <span>{event.chairName || 'Chưa xác định'}</span>
        </p>
      </div>
    );
  };

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
            <h4 className="text-sm btn-primary text-gray-900 mb-1 line-clamp-1">
              {event.title}
              {event.isMultiDay && (
                <span className="ml-1 text-xs opacity-60">↔</span>
              )}
            </h4>
            
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>

            {event.location && (
              <p className="text-xs text-gray-500 truncate mb-1">{event.location}</p>
            )}

            {/* Trạng thái xác nhận (Invite Status) */}
            {event.inviteStatus && (
              <div className="flex items-center gap-1 mt-1 text-[11px]">
                {event.inviteStatus === 'ACCEPTED' && (
                  <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                    Đã xác nhận
                  </span>
                )}
                {event.inviteStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                    Chưa xác nhận
                  </span>
                )}
                {event.inviteStatus === 'DECLINED' && (
                  <span className="inline-flex items-center gap-1 text-rose-500 font-medium line-through">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    Từ chối
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent 
        showArrow={false}
        className="bg-white border border-gray-200 text-gray-900 shadow-lg p-3 max-w-[280px] rounded-xl"
      >
        {renderTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
};
