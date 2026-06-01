import React, { useState, useMemo, useEffect } from 'react';
import { CalendarControls } from '@/modules/calendar/components/CalendarControls';
import { WeekCalendarView, WeekDay } from '@/modules/calendar/components/WeekCalendarView';
import { MonthCalendarView, MonthDay } from '@/modules/calendar/components/MonthCalendarView';
import { CalendarEvent } from '@/modules/calendar/components/CalendarEventCard';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { meetingApi, MeetingResponse } from '@/modules/meeting/services/meeting.api';

const calendarCache = new Map<string, { data: MeetingResponse[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 phút

const isEventOnDay = (event: CalendarEvent, date: Date) => {
  if (!event.originalStartTime || !event.originalEndTime) return false;
  const meetingStart = new Date(event.originalStartTime);
  const meetingEnd = new Date(event.originalEndTime);
  
  const cellStart = new Date(date);
  cellStart.setHours(0, 0, 0, 0);
  
  const cellEnd = new Date(date);
  cellEnd.setHours(23, 59, 59, 999);
  
  return meetingStart <= cellEnd && meetingEnd >= cellStart;
};


const getMondayOfDate = (date: Date): Date => {
  const curr = new Date(date);
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};


const mapToCalendarEvent = (meeting: MeetingResponse): CalendarEvent => {
  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);
  
  const startTimeStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  let status: 'ongoing' | 'upcoming' | 'finished' = 'upcoming';
  if (meeting.status === 'IN_PROGRESS') {
    status = 'ongoing';
  } else if (meeting.status === 'CLOSED' || meeting.status === 'EXPIRED') {
    status = 'finished';
  }
  
  return {
    id: meeting.id,
    title: meeting.title,
    startTime: startTimeStr,
    endTime: endTimeStr,
    status: status,
    location: meeting.locationName || 'Chưa xác định',
    inviteStatus: meeting.callerInviteStatus,
    chairName: meeting.chairName,
    originalStartTime: meeting.startTime,
    originalEndTime: meeting.endTime,
  };
};

const LichHopPage = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [apiEvents, setApiEvents] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Map toàn bộ danh sách meetingResponse sang CalendarEvent một lần duy nhất để tối ưu hiệu năng
  const calendarEvents = useMemo(() => {
    return apiEvents.map(mapToCalendarEvent);
  }, [apiEvents]);

  // Tính toán khoảng thời gian bắt đầu và kết thúc hiển thị trên Lịch
  const { fromDate, toDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'week') {
      const monday = getMondayOfDate(currentDate);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return { fromDate: monday, toDate: sunday };
    } else {
      // Month view
      const firstDay = new Date(year, month, 1);
      let startDayOfWeek = firstDay.getDay();
      startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
      const mondayOfFirstWeek = new Date(year, month, 1 - startDayOfWeek);
      mondayOfFirstWeek.setHours(0, 0, 0, 0);

      const lastDay = new Date(year, month + 1, 0);
      const totalDays = startDayOfWeek + lastDay.getDate();
      const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
      const sundayOfLastWeek = new Date(year, month, lastDay.getDate() + remainingDays);
      sundayOfLastWeek.setHours(23, 59, 59, 999);

      return { fromDate: mondayOfFirstWeek, toDate: sundayOfLastWeek };
    }
  }, [currentDate, viewMode]);

  const fetchMeetings = async (from: Date, to: Date, forceRefresh = false) => {
    const cacheKey = `${from.toISOString()}_${to.toISOString()}`;
    
    if (!forceRefresh) {
      const cached = calendarCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setApiEvents(cached.data);
        return;
      }
    }
    
    try {
      setLoading(true);
      const res = await meetingApi.getCalendarMeetings({
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        statuses: ['UPCOMING', 'IN_PROGRESS', 'CLOSED'],
        onlyMyMeetings: true,
      });
      if (res.success && res.data) {
        setApiEvents(res.data);
        calendarCache.set(cacheKey, { data: res.data, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Failed to fetch calendar meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings(fromDate, toDate);
  }, [fromDate, toDate]);

  const handleRefresh = () => {
    fetchMeetings(fromDate, toDate, true);
  };

  // Tính toán dữ liệu xem Tháng từ calendarEvents
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const weeks: MonthDay[][] = [];
    let currentWeek: MonthDay[] = [];

    // Add previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNum);
      
      const dayEvents = calendarEvents.filter(event => isEventOnDay(event, date));

      currentWeek.push({
        date,
        dayNumber: dayNum,
        month: month - 1,
        isCurrentMonth: false,
        events: dayEvents,
      });
    }

    const today = new Date();

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const dayEvents = calendarEvents.filter(event => isEventOnDay(event, date));

      currentWeek.push({
        date,
        dayNumber: day,
        month,
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add next month days
    if (currentWeek.length > 0) {
      const remainingDays = 7 - currentWeek.length;
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        
        const dayEvents = calendarEvents.filter(event => isEventOnDay(event, date));

        currentWeek.push({
          date: date,
          dayNumber: i,
          month: month + 1,
          isCurrentMonth: false,
          events: dayEvents,
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentDate, calendarEvents]);

  // Tính toán dữ liệu xem Tuần từ calendarEvents
  const weekData = useMemo(() => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const monday = getMondayOfDate(currentDate);

    const rawWeekData: WeekDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayOfWeek = date.getDay();

      const dayEvents = calendarEvents.filter(event => isEventOnDay(event, date));

      rawWeekData.push({
        date: date,
        dayName: dayNames[dayOfWeek],
        dayNumber: date.getDate(),
        monthNumber: date.getMonth() + 1,
        isHighlight: date.toDateString() === new Date().toDateString(),
        events: dayEvents,
      });
    }

    return rawWeekData;
  }, [currentDate, calendarEvents]);

  const handlePrevPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const dateRangeLabel = useMemo(() => {
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    if (viewMode === 'week') {
      const monday = getMondayOfDate(currentDate);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${monday.getDate()} – ${sunday.getDate()} Thg ${months[monday.getMonth()]}, ${monday.getFullYear()}`;
    }
    return `Tháng ${months[currentDate.getMonth()]} Năm ${currentDate.getFullYear()}`;
  }, [currentDate, viewMode]);

  return (
    <div className="p-8">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { name: "Trang chủ", path: "/" },
          { name: "Phòng họp" },
          { name: "Lịch họp" },
        ]}
      />

      {/* Điều khiển lịch */}
      <div>
        <CalendarControls
          dateRangeLabel={dateRangeLabel}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            setCurrentDate(new Date()); // Reset về ngày hiện tại khi đổi chế độ xem
          }}
          onPrevious={handlePrevPeriod}
          onNext={handleNextPeriod}
        />
      </div>

      {/* Hiển thị theo chế độ Tuần hoặc Tháng */}
      <div className="mt-6 relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-[#C8102E]"></div>
              <span className="text-sm font-medium text-gray-500 heading">Đang tải lịch họp...</span>
            </div>
          </div>
        )}

        {viewMode === 'week' ? (
          <WeekCalendarView
            weekDays={weekData}
          />
        ) : (
          <MonthCalendarView
            monthDays={monthData}
          />
        )}
      </div>
    </div>
  );
};

export default LichHopPage;
