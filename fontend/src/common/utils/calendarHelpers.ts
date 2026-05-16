import { CalendarEvent } from '@/modules/calendar/components/CalendarEventCard';

export interface ProcessedEvent extends CalendarEvent {
  originalStartTime: string;
  originalEndTime: string;
  isMultiDay?: boolean;
  spansDays?: number;
  displayDate?: Date;
}

/**
 * Kiểm tra xem thời gian kết thúc có qua ngày hôm sau không
 */
export const isEventSpanningDays = (startTime: string, endTime: string): boolean => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Nếu endTime nhỏ hơn startTime, nghĩa là cuộc họp kéo dài sang ngày hôm sau
  return endMinutes < startMinutes;
};

/**
 * Tính toán thời gian hiển thị cho cuộc họp kéo dài nhiều ngày
 */
export const getDisplayTimeRange = (
  startTime: string,
  endTime: string,
  isStart: boolean
): string => {
  if (isStart) {
    // Ngày bắt đầu: hiển thị từ startTime đến 24:00
    return `${startTime} - 24:00`;
  } else {
    // Ngày kết thúc: hiển thị từ 00:00 đến endTime
    return `00:00 - ${endTime}`;
  }
};

/**
 * Xử lý events để phát hiện và tách các cuộc họp kéo dài nhiều ngày
 */
export const processEventsForMultiDay = (
  events: CalendarEvent[],
  date: Date
): ProcessedEvent[] => {
  const processedEvents: ProcessedEvent[] = [];

  events.forEach((event) => {
    if (isEventSpanningDays(event.startTime, event.endTime)) {
      // Cuộc họp kéo dài sang ngày hôm sau
      // Hiển thị phần của ngày hiện tại
      processedEvents.push({
        ...event,
        id: `${event.id}-day1`,
        originalStartTime: event.startTime,
        originalEndTime: event.endTime,
        startTime: event.startTime,
        endTime: '24:00',
        isMultiDay: true,
        spansDays: 2,
        displayDate: date,
      });
    } else {
      // Cuộc họp bình thường
      processedEvents.push({
        ...event,
        originalStartTime: event.startTime,
        originalEndTime: event.endTime,
      });
    }
  });

  return processedEvents;
};

/**
 * Kiểm tra xem có cuộc họp nào từ ngày hôm trước kéo dài đến ngày này không
 */
export const getEventsFromPreviousDay = (
  previousDayEvents: CalendarEvent[],
  currentDate: Date
): ProcessedEvent[] => {
  const continuingEvents: ProcessedEvent[] = [];

  previousDayEvents.forEach((event) => {
    if (isEventSpanningDays(event.startTime, event.endTime)) {
      // Cuộc họp này kéo dài sang ngày hôm nay
      continuingEvents.push({
        ...event,
        id: `${event.id}-day2`,
        originalStartTime: event.startTime,
        originalEndTime: event.endTime,
        startTime: '00:00',
        endTime: event.endTime,
        isMultiDay: true,
        spansDays: 2,
        displayDate: currentDate,
      });
    }
  });

  return continuingEvents;
};

/**
 * Hợp nhất events của ngày hiện tại với events kéo dài từ ngày hôm trước
 */
export const mergeEventsWithPreviousDay = (
  currentDayEvents: CalendarEvent[],
  previousDayEvents: CalendarEvent[],
  currentDate: Date
): CalendarEvent[] => {
  // Lấy events từ ngày hôm trước kéo dài sang
  const continuingEvents = getEventsFromPreviousDay(previousDayEvents, currentDate);

  // Xử lý events của ngày hiện tại
  const processedCurrentEvents = processEventsForMultiDay(currentDayEvents, currentDate);

  // Hợp nhất và sắp xếp theo thời gian
  const allEvents = [...continuingEvents, ...processedCurrentEvents];

  return allEvents.sort((a, b) => {
    const [aHour, aMinute] = a.startTime.split(':').map(Number);
    const [bHour, bMinute] = b.startTime.split(':').map(Number);
    return aHour * 60 + aMinute - (bHour * 60 + bMinute);
  });
};
