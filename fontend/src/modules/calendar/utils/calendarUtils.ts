import { CalendarEvent } from "../components/CalendarEventCard";
import { MonthDay } from "../components/MonthCalendarView";
import { WeekDay } from "../components/WeekCalendarView";
import { mergeEventsWithPreviousDay } from "@/common/utils/calendarHelpers";

export const generateMonthData = (currentDate: Date, mockEvents: { [key: number]: CalendarEvent[] }): MonthDay[][] => {
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
        currentWeek.push({
            date,
            dayNumber: dayNum,
            month: month - 1,
            isCurrentMonth: false,
            events: [],
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

        const currentDayEvents = mockEvents[day] || [];
        const previousDayEvents = day === 1 ? [] : (mockEvents[day - 1] || []);
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
            currentWeek.push({
                date: new Date(year, month + 1, i),
                dayNumber: i,
                month: month + 1,
                isCurrentMonth: false,
                events: [],
            });
        }
        weeks.push(currentWeek);
    }

    return weeks;
};

export const generateWeekData = (currentDate: Date, monthData: MonthDay[][]): WeekDay[] => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const rawWeekData: WeekDay[] = [];
    const monthDataFlat = monthData.flat();

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dayOfWeek = date.getDay();

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
            isHighlight: date.toDateString() === new Date().toDateString(),
            events: matchingDay?.events || [],
        });
    }

    return rawWeekData;
};
