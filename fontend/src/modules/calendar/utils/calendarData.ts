import { CalendarEvent } from "../components/CalendarEventCard";

export const MOCK_CALENDAR_EVENTS: { [key: number]: CalendarEvent[] } = {
  1: [
    { id: 'e-1-1', title: 'Họp giao ban đầu tháng', startTime: '08:00', endTime: '10:00', status: 'finished' },
  ],
  2: [
    { id: 'e-2-1', title: 'Tổ chức đào tạo HDSD lần 1', startTime: '09:00', endTime: '11:00', status: 'finished' },
  ],
  7: [
    { id: 'e-7-1', title: 'Họp giao ban tuần UBND', startTime: '09:00', endTime: '11:00', status: 'ongoing' },
    { id: 'e-7-2', title: 'Họp ban chỉ đạo dự án khu đô thị', startTime: '14:00', endTime: '16:00', status: 'upcoming' },
    { id: 'e-7-3', title: 'Họp tổng kết dự án cũ', startTime: '16:30', endTime: '18:00', status: 'finished' },
  ],
  10: [
    { id: 'e-10-1', title: 'Họp xét duyệt kế hoạch Q2', startTime: '10:00', endTime: '12:00', status: 'ongoing' },
  ],
  15: [
    { id: 'e-15-1', title: 'Họp triển khai dự án đường bộ', startTime: '09:00', endTime: '11:30', status: 'ongoing' },
    { id: 'e-15-4', title: 'Họp đánh giá tiến độ', startTime: '17:30', endTime: '18:30', status: 'finished' },
  ],
  20: [
    { id: 'e-20-1', title: 'Họp thẩm định dự án hạ tầng', startTime: '08:30', endTime: '10:30', status: 'finished' },
    { id: 'e-20-4', title: 'Họp ban quản lý', startTime: '18:00', endTime: '19:00', status: 'upcoming' },
  ],
};
