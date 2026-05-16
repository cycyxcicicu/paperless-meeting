import React, { useState, useMemo } from 'react';
import { CalendarControls } from '@/modules/calendar/components/CalendarControls';
import { WeekCalendarView } from '@/modules/calendar/components/WeekCalendarView';
import { MonthCalendarView } from '@/modules/calendar/components/MonthCalendarView';
import { CalendarEvent } from '@/modules/calendar/components/CalendarEventCard';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { generateMonthData, generateWeekData } from '../utils/calendarUtils';
import { MOCK_CALENDAR_EVENTS } from '../utils/calendarData';

const LichHopPage = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  // Mặc định lấy ngày hiện tại của hệ thống
  const [currentDate, setCurrentDate] = useState(new Date());

  // Sử dụng helper để tính toán dữ liệu Tháng
  const monthData = useMemo(() => 
    generateMonthData(currentDate, MOCK_CALENDAR_EVENTS), 
    [currentDate]
  );

  // Sử dụng helper để tính toán dữ liệu Tuần
  const weekData = useMemo(() => 
    generateWeekData(currentDate, monthData), 
    [currentDate, monthData]
  );

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

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
  };

  const getDateRangeLabel = () => {
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    if (viewMode === 'week') {
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(curr.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${monday.getDate()} – ${sunday.getDate()} Thg ${months[monday.getMonth()]}, ${monday.getFullYear()}`;
    }
    return `Tháng ${months[currentDate.getMonth()]} Năm ${currentDate.getFullYear()}`;
  };

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
      <CalendarControls
        dateRangeLabel={getDateRangeLabel()}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setCurrentDate(new Date()); // Reset về ngày hiện tại khi đổi chế độ xem
        }}
        onPrevious={handlePrevPeriod}
        onNext={handleNextPeriod}
      />

      {/* Hiển thị theo chế độ Tuần hoặc Tháng */}
      <div className="mt-6">
        {viewMode === 'week' ? (
          <WeekCalendarView
            weekDays={weekData}
            onEventClick={handleEventClick}
          />
        ) : (
          <MonthCalendarView
            monthDays={monthData}
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </div>
  );
};

export default LichHopPage;
