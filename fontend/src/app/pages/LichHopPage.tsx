import React, { useState, useMemo } from 'react';
import { LICH_HOP_SIDEBAR_ITEMS } from '../constants/sidebar';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { Calendar as CalendarIcon, MapPin, FileText, Vote, BarChart3, Settings, Home } from 'lucide-react';
import { CalendarControls } from '../components/calendar/CalendarControls';
import { WeekCalendarView, WeekDay } from '../components/calendar/WeekCalendarView';
import { MonthCalendarView, MonthDay } from '../components/calendar/MonthCalendarView';
import { CalendarEvent } from '../components/calendar/CalendarEventCard';
import { mergeEventsWithPreviousDay } from '../utils/calendarHelpers';



const LichHopPage = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 7)); // 7/4/2026

  // Generate month data based on currentDate
  const generateMonthData = (): MonthDay[][] => {
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
    const prevMonthEvents: { [key: number]: CalendarEvent[] } = {
      31: [
        {
          id: 'e-31-1',
          title: 'Phiên họp tổng duyệt trước khi đào tạo triển khai hệ thống Phòng họp không giấy',
          startTime: '15:30',
          endTime: '17:30',
          status: 'ongoing',
        },
        {
          id: 'e-31-2',
          title: 'test không xem được phiên 1',
          startTime: '21:20',
          endTime: '22:11',
          status: 'upcoming',
        },
      ],
    };

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNum);

      // Lấy events của ngày này trong tháng trước
      const currentDayEvents = prevMonthEvents[dayNum] || [];

      // Lấy events của ngày hôm trước (nếu có trong currentWeek)
      let previousDayEvents: CalendarEvent[] = [];
      if (dayNum > 1) {
        const prevDay = currentWeek.find(d => d.dayNumber === dayNum - 1 && d.month === month - 1);
        if (prevDay) {
          previousDayEvents = prevDay.events;
        } else {
          previousDayEvents = prevMonthEvents[dayNum - 1] || [];
        }
      }

      // Hợp nhất events
      const mergedEvents = mergeEventsWithPreviousDay(currentDayEvents, previousDayEvents, date);

      currentWeek.push({
        date,
        dayNumber: dayNum,
        month: month - 1,
        isCurrentMonth: false,
        events: mergedEvents,
      });
    }

    // Mock events for current month
    const mockEvents: { [key: number]: CalendarEvent[] } = {
      1: [
        {
          id: 'e-1-1',
          title: 'test thông báo xí',
          startTime: '23:19',
          endTime: '00:18',
          status: 'upcoming',
        },
        {
          id: 'e-1-2',
          title: 'a123',
          startTime: '23:26',
          endTime: '00:25',
          status: 'upcoming',
        },
      ],
      2: [
        {
          id: 'e-2-1',
          title: 'test role',
          startTime: '23:38',
          endTime: '00:37',
          status: 'ongoing',
        },
        {
          id: 'e-2-2',
          title: 'Tổ chức đào tạo HDSD lần 1',
          startTime: '09:00',
          endTime: '11:00',
          status: 'ongoing',
        },
      ],
      3: [
        {
          id: 'e-3-1',
          title: 'test ngoài phiên',
          startTime: '22:27',
          endTime: '22:27',
          status: 'upcoming',
        },
      ],
      5: [
        {
          id: 'e-5-1',
          title: 'tổng kết tháng 33333',
          startTime: '17:00',
          endTime: '18:20',
          status: 'upcoming',
        },
      ],
      7: [
        {
          id: 'e-7-1',
          title: 'Họp giao ban tuần UBND',
          startTime: '09:00',
          endTime: '11:00',
          status: 'ongoing',
        },
        {
          id: 'e-7-2',
          title: 'Họp ban chỉ đạo dự án khu đô thị',
          startTime: '14:00',
          endTime: '16:00',
          status: 'upcoming',
        },
        {
          id: 'e-7-3',
          title: 'Họp triển khai công tác số hóa',
          startTime: '16:30',
          endTime: '18:00',
          status: 'upcoming',
        },
      ],
      10: [
        {
          id: 'e-10-1',
          title: 'Họp xét duyệt kế hoạch Q2',
          startTime: '10:00',
          endTime: '12:00',
          status: 'ongoing',
        },
        {
          id: 'e-10-2',
          title: 'Họp phòng Tài chính',
          startTime: '14:00',
          endTime: '15:30',
          status: 'upcoming',
        },
      ],
      15: [
        {
          id: 'e-15-1',
          title: 'Họp triển khai dự án đường bộ',
          startTime: '09:00',
          endTime: '11:30',
          status: 'ongoing',
        },
        {
          id: 'e-15-2',
          title: 'Họp ban quản lý dự án',
          startTime: '13:30',
          endTime: '15:00',
          status: 'upcoming',
        },
        {
          id: 'e-15-3',
          title: 'Họp tổng kết tuần',
          startTime: '16:00',
          endTime: '17:00',
          status: 'upcoming',
        },
        {
          id: 'e-15-4',
          title: 'Họp đánh giá tiến độ',
          startTime: '17:30',
          endTime: '18:30',
          status: 'upcoming',
        },
      ],
      20: [
        {
          id: 'e-20-1',
          title: 'Họp thẩm định dự án hạ tầng',
          startTime: '08:30',
          endTime: '10:30',
          status: 'ongoing',
        },
        {
          id: 'e-20-2',
          title: 'Họp cấp ủy',
          startTime: '14:00',
          endTime: '16:00',
          status: 'upcoming',
        },
        {
          id: 'e-20-3',
          title: 'Họp phòng Xây dựng',
          startTime: '16:30',
          endTime: '17:30',
          status: 'upcoming',
        },
        {
          id: 'e-20-4',
          title: 'Họp ban quản lý',
          startTime: '18:00',
          endTime: '19:00',
          status: 'upcoming',
        },
        {
          id: 'e-20-5',
          title: 'Họp review tuần',
          startTime: '19:30',
          endTime: '20:30',
          status: 'upcoming',
        },
      ],
      25: [
        {
          id: 'e-25-1',
          title: 'Họp giao ban cuối tháng',
          startTime: '09:00',
          endTime: '11:00',
          status: 'ongoing',
        },
        {
          id: 'e-25-2',
          title: 'Họp đánh giá KPI tháng 4',
          startTime: '14:00',
          endTime: '16:00',
          status: 'upcoming',
        },
        {
          id: 'e-25-3',
          title: 'Họp kế hoạch tháng 5',
          startTime: '16:30',
          endTime: '18:00',
          status: 'upcoming',
        },
        {
          id: 'e-25-4',
          title: 'Họp phòng Hành chính',
          startTime: '19:00',
          endTime: '20:00',
          status: 'upcoming',
        },
        {
          id: 'e-25-5',
          title: 'Họp ban lãnh đạo',
          startTime: '20:30',
          endTime: '21:30',
          status: 'upcoming',
        },
        {
          id: 'e-25-6',
          title: 'Họp tổng kết quý',
          startTime: '22:00',
          endTime: '23:00',
          status: 'upcoming',
        },
        {
          id: 'e-25-7',
          title: 'Họp đột xuất',
          startTime: '23:30',
          endTime: '00:00',
          status: 'upcoming',
        },
      ],
    };

    const today = new Date();

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      // Lấy events của ngày hiện tại
      const currentDayEvents = mockEvents[day] || [];

      // Lấy events của ngày hôm trước (bao gồm cả tháng trước nếu day = 1)
      let previousDayEvents: CalendarEvent[] = [];
      if (day === 1) {
        // Ngày đầu tháng, lấy events của ngày cuối tháng trước
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        // Kiểm tra trong currentWeek có ngày cuối tháng trước không
        const prevDayInWeek = currentWeek.find(d => d.dayNumber === prevMonthLastDay && d.month === month - 1);
        previousDayEvents = prevDayInWeek?.events || [];
      } else {
        // Lấy events của ngày hôm trước trong cùng tháng
        previousDayEvents = mockEvents[day - 1] || [];
      }

      // Hợp nhất events với ngày hôm trước
      const mergedEvents = mergeEventsWithPreviousDay(currentDayEvents, previousDayEvents, date);

      currentWeek.push({
        date,
        dayNumber: day,
        month,
        isCurrentMonth: true,
        isToday,
        events: mergedEvents,
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

        // Lấy events của ngày hôm trước (ngày cuối cùng trong currentWeek)
        let previousDayEvents: CalendarEvent[] = [];
        if (i === 1 && currentWeek.length > 0) {
          // Ngày đầu tháng sau, lấy events của ngày cuối tháng này
          const lastDayOfCurrentMonth = currentWeek[currentWeek.length - 1];
          previousDayEvents = lastDayOfCurrentMonth.events;
        }

        // Ngày trong tháng sau không có events trong mock data
        const currentDayEvents: CalendarEvent[] = [];

        // Hợp nhất events
        const mergedEvents = mergeEventsWithPreviousDay(currentDayEvents, previousDayEvents, date);

        currentWeek.push({
          date,
          dayNumber: i,
          month: month + 1,
          isCurrentMonth: false,
          events: mergedEvents,
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const monthData = useMemo(() => generateMonthData(), [currentDate]);

  // Generate week data based on currentDate
  const generateWeekData = (): WeekDay[] => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    // Get Monday of the current week
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(curr.setDate(diff));

    const rawWeekData: WeekDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayOfWeek = date.getDay();

      // Get events for this specific date from monthData
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const monthDataFlat = monthData.flat();
      const matchingDay = monthDataFlat.find(d =>
        d.date.getFullYear() === date.getFullYear() &&
        d.date.getMonth() === date.getMonth() &&
        d.date.getDate() === date.getDate()
      );

      rawWeekData.push({
        date: date,
        dayName: dayNames[dayOfWeek],
        dayNumber: date.getDate(),
        monthNumber: date.getMonth() + 1,
        isHighlight: date.toDateString() === currentDate.toDateString(),
        events: matchingDay?.events || [],
      });
    }

    // Xử lý events kéo dài nhiều ngày cho mỗi ngày trong tuần
    return rawWeekData.map((day, index) => {
      const previousDay = index > 0 ? rawWeekData[index - 1] : null;
      const previousDayEvents = previousDay?.events || [];

      const mergedEvents = mergeEventsWithPreviousDay(
        day.events,
        previousDayEvents,
        day.date
      );

      return {
        ...day,
        events: mergedEvents,
      };
    });
  };

  const mockWeekData = useMemo(() => generateWeekData(), [currentDate, monthData]);

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
      // Calculate week range
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(curr.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return `${monday.getDate()} – ${sunday.getDate()} Thg ${months[monday.getMonth()]}, ${monday.getFullYear()}`;
    } else {
      return `Tháng ${months[currentDate.getMonth()]} Năm ${currentDate.getFullYear()}`;
    }
  };

  return (
    <>

        {/* Page Header */}
        <div className="bg-white border-b border-gray-200/60 px-8 py-6 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            <Home className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
            <span>/</span>
            <span>Phòng họp</span>
            <span>/</span>
            <span className="text-[#C8102E]">Lịch họp</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
                Lịch họp
              </h1>
              <p className="text-sm text-gray-500">
                Theo dõi lịch và quản lý các cuộc họp
              </p>
            </div>
          </div>
        </div>

        <div className="px-8">
          <CalendarControls
            dateRangeLabel={getDateRangeLabel()}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPrevious={handlePrevPeriod}
            onNext={handleNextPeriod}
          />

          {viewMode === 'week' && (
            <WeekCalendarView
              weekDays={mockWeekData}
              onEventClick={handleEventClick}
            />
          )}

          {viewMode === 'month' && (
            <MonthCalendarView
              monthDays={monthData}
              onEventClick={handleEventClick}
            />
          )}
        </div>
    </>
  );
};

export default LichHopPage;
