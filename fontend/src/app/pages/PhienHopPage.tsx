import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  Plus,
  FileText,
  CheckCircle2,
  Circle,
  ChevronDown,
  Search,
  Eye
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Sidebar, SidebarItem } from '../components/layout/Sidebar';
import { FilterBar } from '../components/layout/FilterBar';
import { SearchInput } from '../components/ui/hp-search';
import { Button } from '../components/ui/hp-button';
import { Badge } from '../components/ui/hp-badge';
import { Card, CardContent } from '../components/ui/hp-card';
import { AppPagination } from '../components/common/AppPagination';
import { MeetingActionMenu } from '../components/meeting/MeetingActionMenu';
import { ConfirmActionModal } from '../components/meeting/ConfirmActionModal';
import { PostponeModal, PostponeData } from '../components/meeting/PostponeModal';
import { toast } from '../../lib/toast';

const sidebarItems: SidebarItem[] = [
  { name: 'Tất cả phiên họp', path: '/phien-hop', badge: '30' },
];

const PhienHopPage = () => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string>('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: 'cancel' | 'send' | 'postpone';
    meetingId: number;
    meetingTitle: string;
  } | null>(null);

  const [postponeModal, setPostponeModal] = useState<{
    isOpen: boolean;
    meetingId: number;
    oldStartTime: string;
    oldEndTime: string;
  } | null>(null);

  // Mock data mở rộng (30+ phiên họp)
  const allMeetings = [
    {
      id: 1,
      title: 'Họp Ban Chấp hành Đảng bộ thành phố',
      date: '25/03/2026',
      time: '14:00 - 16:00',
      location: 'Phòng họp A - Tầng 5',
      host: 'Ông Nguyễn Văn A',
      participants: 35,
      documents: 12,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 31,
      title: 'Họp triển khai chiến lược phát triển 2026-2030 (Nháp)',
      date: '24/04/2026',
      time: '09:00 - 11:00',
      location: 'Phòng họp Y - Tầng 3',
      host: 'Ông Nguyễn Văn FF',
      participants: 42,
      documents: 8,
      status: 'Nháp',
      statusVariant: 'warning' as const,
    },
    {
      id: 32,
      title: 'Họp đánh giá hiệu quả đầu tư quý I/2026 (Nháp)',
      date: '25/04/2026',
      time: '14:00 - 16:00',
      location: 'Phòng họp Z - Tầng 4',
      host: 'Bà Trần Thị GG',
      participants: 28,
      documents: 12,
      status: 'Nháp',
      statusVariant: 'warning' as const,
    },
    {
      id: 2,
      title: 'Họp triển khai kế hoạch quý II/2026',
      date: '26/03/2026',
      time: '08:30 - 11:00',
      location: 'Hội trường lớn - Tầng 1',
      host: 'Bà Trần Thị B',
      participants: 120,
      documents: 25,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 3,
      title: 'Họp giao ban tuần',
      date: '27/03/2026',
      time: '15:00 - 16:30',
      location: 'Phòng họp B - Tầng 3',
      host: 'Ông Lê Văn C',
      participants: 25,
      documents: 5,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 4,
      title: 'Họp đánh giá kết quả thực hiện nhiệm vụ tháng 3',
      date: '28/03/2026',
      time: '09:00 - 11:30',
      location: 'Phòng họp C - Tầng 4',
      host: 'Bà Phạm Thị D',
      participants: 45,
      documents: 18,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 5,
      title: 'Họp xét duyệt dự án đầu tư công',
      date: '29/03/2026',
      time: '14:00 - 17:00',
      location: 'Hội trường nhỏ - Tầng 2',
      host: 'Ông Hoàng Văn E',
      participants: 60,
      documents: 32,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 6,
      title: 'Họp Ban Thường vụ Thành ủy',
      date: '30/03/2026',
      time: '08:00 - 12:00',
      location: 'Phòng họp VIP - Tầng 6',
      host: 'Ông Trần Văn F',
      participants: 15,
      documents: 8,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 7,
      title: 'Họp triển khai công tác phòng chống dịch',
      date: '31/03/2026',
      time: '09:30 - 11:00',
      location: 'Phòng họp D - Tầng 2',
      host: 'Bà Nguyễn Thị G',
      participants: 80,
      documents: 15,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 8,
      title: 'Họp bàn giải pháp phát triển du lịch',
      date: '01/04/2026',
      time: '14:30 - 17:00',
      location: 'Phòng họp E - Tầng 3',
      host: 'Ông Lê Văn H',
      participants: 50,
      documents: 20,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 9,
      title: 'Họp đánh giá tiến độ dự án hạ tầng',
      date: '02/04/2026',
      time: '08:00 - 10:30',
      location: 'Phòng họp F - Tầng 4',
      host: 'Bà Phạm Thị I',
      participants: 40,
      documents: 28,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 10,
      title: 'Họp triển khai chương trình đào tạo',
      date: '03/04/2026',
      time: '13:00 - 15:30',
      location: 'Phòng họp G - Tầng 5',
      host: 'Ông Hoàng Văn K',
      participants: 90,
      documents: 12,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 11,
      title: 'Họp Ban Chỉ đạo cải cách hành chính',
      date: '04/04/2026',
      time: '09:00 - 11:00',
      location: 'Hội trường chính - Tầng 1',
      host: 'Ông Nguyễn Văn L',
      participants: 65,
      documents: 22,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 12,
      title: 'Họp triển khai kế hoạch tài chính',
      date: '05/04/2026',
      time: '14:00 - 16:30',
      location: 'Phòng họp H - Tầng 2',
      host: 'Bà Trần Thị M',
      participants: 30,
      documents: 18,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 13,
      title: 'Họp giao ban Sở Giáo dục và Đào tạo',
      date: '06/04/2026',
      time: '08:30 - 10:00',
      location: 'Phòng họp I - Tầng 3',
      host: 'Ông Lê Văn N',
      participants: 55,
      documents: 10,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 14,
      title: 'Họp đánh giá công tác y tế',
      date: '07/04/2026',
      time: '15:00 - 17:30',
      location: 'Phòng họp K - Tầng 4',
      host: 'Bà Phạm Thị O',
      participants: 70,
      documents: 25,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 15,
      title: 'Họp Ban Quản lý dự án ODA',
      date: '08/04/2026',
      time: '09:30 - 12:00',
      location: 'Phòng họp L - Tầng 5',
      host: 'Ông Hoàng Văn P',
      participants: 20,
      documents: 30,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 16,
      title: 'Họp triển khai chính sách hỗ trợ doanh nghiệp',
      date: '09/04/2026',
      time: '13:30 - 16:00',
      location: 'Hội trường nhỏ - Tầng 2',
      host: 'Bà Nguyễn Thị Q',
      participants: 100,
      documents: 16,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 17,
      title: 'Họp đánh giá công tác môi trường',
      date: '10/04/2026',
      time: '08:00 - 10:30',
      location: 'Phòng họp M - Tầng 3',
      host: 'Ông Trần Văn R',
      participants: 45,
      documents: 14,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 18,
      title: 'Họp Ban Chỉ đạo phòng chống thiên tai',
      date: '11/04/2026',
      time: '14:00 - 16:00',
      location: 'Phòng họp N - Tầng 4',
      host: 'Bà Lê Thị S',
      participants: 35,
      documents: 20,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 19,
      title: 'Họp triển khai công tác văn hóa',
      date: '12/04/2026',
      time: '09:00 - 11:30',
      location: 'Phòng họp O - Tầng 5',
      host: 'Ông Phạm Văn T',
      participants: 60,
      documents: 11,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 20,
      title: 'Họp đánh giá công tác nội chính',
      date: '13/04/2026',
      time: '15:00 - 17:00',
      location: 'Phòng họp P - Tầng 2',
      host: 'Bà Hoàng Thị U',
      participants: 28,
      documents: 19,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 21,
      title: 'Họp Ban Chỉ đạo xây dựng nông thôn mới',
      date: '14/04/2026',
      time: '08:30 - 11:00',
      location: 'Hội trường lớn - Tầng 1',
      host: 'Ông Nguyễn Văn V',
      participants: 85,
      documents: 24,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 22,
      title: 'Họp triển khai công tác thanh tra',
      date: '15/04/2026',
      time: '13:00 - 15:30',
      location: 'Phòng họp Q - Tầng 3',
      host: 'Bà Trần Thị W',
      participants: 32,
      documents: 13,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 23,
      title: 'Họp đánh giá công tác quản lý đất đai',
      date: '16/04/2026',
      time: '09:30 - 12:00',
      location: 'Phòng họp R - Tầng 4',
      host: 'Ông Lê Văn X',
      participants: 42,
      documents: 27,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 24,
      title: 'Họp Ban Chỉ đạo chuyển đổi số',
      date: '17/04/2026',
      time: '14:30 - 17:00',
      location: 'Phòng họp S - Tầng 5',
      host: 'Bà Phạm Thị Y',
      participants: 55,
      documents: 21,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 25,
      title: 'Họp triển khai công tác thông tin truyền thông',
      date: '18/04/2026',
      time: '08:00 - 10:30',
      location: 'Phòng họp T - Tầng 2',
      host: 'Ông Hoàng Văn Z',
      participants: 48,
      documents: 17,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 26,
      title: 'Họp đánh giá công tác quốc phòng an ninh',
      date: '19/04/2026',
      time: '13:30 - 16:00',
      location: 'Phòng họp U - Tầng 3',
      host: 'Bà Nguyễn Thị AA',
      participants: 38,
      documents: 23,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 27,
      title: 'Họp Ban Chỉ đạo phát triển công nghiệp',
      date: '20/04/2026',
      time: '09:00 - 11:30',
      location: 'Hội trường chính - Tầng 1',
      host: 'Ông Trần Văn BB',
      participants: 75,
      documents: 26,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
    {
      id: 28,
      title: 'Họp triển khai công tác dân vận',
      date: '21/04/2026',
      time: '14:00 - 16:30',
      location: 'Phòng họp V - Tầng 4',
      host: 'Bà Lê Thị CC',
      participants: 52,
      documents: 9,
      status: 'Đã kết thúc',
      statusVariant: 'default' as const,
    },
    {
      id: 29,
      title: 'Họp đánh giá công tác xây dựng Đảng',
      date: '22/04/2026',
      time: '08:30 - 11:00',
      location: 'Phòng họp W - Tầng 5',
      host: 'Ông Phạm Văn DD',
      participants: 44,
      documents: 15,
      status: 'Sắp diễn ra',
      statusVariant: 'info' as const,
    },
    {
      id: 30,
      title: 'Họp Ban Chỉ đạo phát triển nguồn nhân lực',
      date: '23/04/2026',
      time: '15:00 - 17:30',
      location: 'Phòng họp X - Tầng 2',
      host: 'Bà Hoàng Thị EE',
      participants: 68,
      documents: 31,
      status: 'Đang diễn ra',
      statusVariant: 'success' as const,
    },
  ];

  // Action handlers
  const handleViewDetail = (id: number) => {
    const meeting = allMeetings.find((m) => m.id === id);

    // Điều hướng theo trạng thái phiên họp
    if (meeting?.status === 'Sắp diễn ra') {
      navigate(`/phien-hop/${id}/sap-dien-ra`);
    } else {
      navigate(`/phien-hop/${id}`);
    }
  };

  const handleUpdate = (id: number) => {
    navigate(`/phien-hop/${id}/cap-nhat`);
  };

  const handleCopy = (id: number) => {
    const meeting = allMeetings.find((m) => m.id === id);
    console.log('Copy meeting:', id);
    toast.success('Sao chép thành công', `Đã sao chép phiên họp "${meeting?.title || '#' + id}"`);
  };

  const handlePostpone = (id: number) => {
    const meeting = allMeetings.find((m) => m.id === id);

    // Chỉ cho phép hoãn nếu meeting có status "Sắp diễn ra"
    if (meeting?.status !== 'Sắp diễn ra') {
      toast.warning('Không thể hoãn phiên họp', 'Chỉ có thể hoãn phiên họp có trạng thái "Sắp diễn ra"');
      return;
    }

    // Parse thời gian từ meeting data
    // Format giả định: date là "DD/MM/YYYY", time là "HH:MM - HH:MM"
    const [day, month, year] = meeting.date.split('/');
    const [startTime, endTime] = meeting.time.split(' - ');

    const oldStartTime = `${year}-${month}-${day}T${startTime}`;
    const oldEndTime = `${year}-${month}-${day}T${endTime}`;

    setPostponeModal({
      isOpen: true,
      meetingId: id,
      oldStartTime,
      oldEndTime,
    });
  };

  const handleConfirmPostpone = (data: PostponeData) => {
    console.log('Postpone meeting:', postponeModal?.meetingId, data);

    // Gọi API hoãn phiên họp ở đây
    // API sẽ nhận:
    // - meetingId: postponeModal?.meetingId
    // - newStartTime: data.newStartTime
    // - newEndTime: data.newEndTime
    // - reason: data.reason

    const meeting = allMeetings.find((m) => m.id === postponeModal?.meetingId);
    toast.success('Hoãn phiên họp thành công', `Phiên họp "${meeting?.title || ''}" đã được hoãn sang thời gian mới`);

    // Đóng modal và reset
    setPostponeModal(null);

    // TODO: Refresh lại danh sách phiên họp sau khi hoãn thành công
  };

  const handleCancel = (id: number) => {
    const meeting = allMeetings.find((m) => m.id === id);
    setConfirmModal({
      isOpen: true,
      actionType: 'cancel',
      meetingId: id,
      meetingTitle: meeting?.title || '',
    });
  };

  const handleSend = (id: number) => {
    const meeting = allMeetings.find((m) => m.id === id);
    setConfirmModal({
      isOpen: true,
      actionType: 'send',
      meetingId: id,
      meetingTitle: meeting?.title || '',
    });
  };

  const handleConfirmAction = () => {
    if (!confirmModal) return;

    const meeting = allMeetings.find((m) => m.id === confirmModal.meetingId);

    switch (confirmModal.actionType) {
      case 'cancel':
        console.log('Confirmed cancel:', confirmModal.meetingId);
        toast.success('Hủy phiên họp thành công', `Đã hủy phiên họp "${meeting?.title || ''}"`);
        break;
      case 'send':
        console.log('Confirmed send:', confirmModal.meetingId);
        toast.success('Gửi phiên họp thành công', `Đã gửi phiên họp "${meeting?.title || ''}" đến các thành viên`);
        break;
      case 'postpone':
        console.log('Confirmed postpone:', confirmModal.meetingId);
        toast.success('Hoãn phiên họp thành công', `Đã hoãn phiên họp "${meeting?.title || ''}"`);
        break;
    }

    setConfirmModal(null);
  };

  // Filter và pagination logic
  const filteredMeetings = useMemo(() => {
    let result = allMeetings;

    // Filter by status
    if (selectedStatus !== 'all') {
      const statusMap: Record<string, string> = {
        upcoming: 'Sắp diễn ra',
        ongoing: 'Đang diễn ra',
        completed: 'Đã kết thúc',
        draft: 'Nháp',
      };
      result = result.filter(m => m.status === statusMap[selectedStatus]);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.host.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedStatus, searchQuery]);

  // Pagination calculations
  const totalItems = filteredMeetings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedMeetings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMeetings.slice(startIndex, endIndex);
  }, [filteredMeetings, currentPage, pageSize]);

  return (
    <div className="flex">
      <Sidebar title="Phiên họp" items={sidebarItems} />
      
      <main className="flex-1 ml-60 p-8">
        <PageHeader
          title="Quản lý phiên họp"
          description="Danh sách các phiên họp và cuộc họp sắp tới"
          breadcrumbs={[
            { name: 'Trang chủ', path: '/' },
            { name: 'Phiên họp' },
          ]}
          actions={
            <>
              <Button variant="secondary" size="default">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </Button>
              <Link to="/phien-hop/tao-moi">
                <Button variant="primary" size="default">
                  <Plus className="h-4 w-4" />
                  Tạo phiên họp
                </Button>
              </Link>
            </>
          }
        />

        <FilterBar>
          <div className="flex items-center gap-3 flex-1">
            {/* Enhanced Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                placeholder="Tìm kiếm theo tên phiên họp, chủ trì..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] hover:border-[#C8102E]/30 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-all"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter
                }}
                className="h-10 pl-3 pr-10 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] font-medium hover:border-[#C8102E]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:border-[#C8102E] transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: 'none'
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Nháp</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="completed">Đã kết thúc</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <ChevronDown className="h-4 w-4 text-[#6B7280]" />
              </div>
            </div>

            {/* Time Filter Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="h-10 pl-3 pr-9 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] font-medium hover:border-[#C8102E]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:border-[#C8102E] transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: 'none'
                }}
              >
                <option value="month">Tháng này</option>
                <option value="week">Tuần này</option>
                <option value="today">Hôm nay</option>
                <option value="custom">Tùy chọn</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span>Tìm thấy <strong className="text-[#111827]">{totalItems}</strong> phiên họp</span>
          </div>
        </FilterBar>

        {/* Meetings List */}
        <div className="space-y-4 mb-6">
          {paginatedMeetings.length > 0 ? (
            paginatedMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Left: Date icon + Content */}
                    <div className="flex gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-[#FEF2F2] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-[#C8102E] font-medium">
                          {meeting.date.split('/')[0]}
                        </span>
                        <span className="text-lg font-bold text-[#C8102E]">
                          T{meeting.date.split('/')[1]}
                        </span>
                      </div>

                      <div className="flex-1">
                        {/* Title */}
                        <div className="flex flex-col mb-2">
                          <h3 className="text-base font-semibold text-[#111827] mb-1">
                            {meeting.title}
                          </h3>
                          <p className="text-sm text-[#6B7280]">
                            Chủ trì: {meeting.host}
                          </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <Clock className="h-4 w-4 text-[#9CA3AF]" />
                            <span>{meeting.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <Users className="h-4 w-4 text-[#9CA3AF]" />
                            <span>{meeting.participants} thành viên</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <MapPin className="h-4 w-4 text-[#9CA3AF]" />
                            <span>{meeting.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <FileText className="h-4 w-4 text-[#9CA3AF]" />
                            <span>{meeting.documents} tài liệu</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center pt-1">
                      {/* Status Badge Column */}
                      <div className="w-[140px] flex justify-start flex-shrink-0">
                        <Badge 
                          variant={meeting.statusVariant} 
                          className="h-[30px] px-3.5 text-[13px] rounded-full whitespace-nowrap font-medium"
                        >
                          {meeting.status}
                        </Badge>
                      </div>

                      {/* View Detail Icon */}
                      <div className="w-10 flex justify-center flex-shrink-0">
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(meeting.id)}
                            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-[#C8102E] transition-all"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap">
                              Xem chi tiết
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Menu (3 dots) */}
                      <div className="w-10 flex justify-center flex-shrink-0">
                        <MeetingActionMenu
                          meetingId={meeting.id}
                          status={meeting.status}
                          onViewDetail={handleViewDetail}
                          onUpdate={handleUpdate}
                          onCopy={handleCopy}
                          onPostpone={handlePostpone}
                          onCancel={handleCancel}
                          onSend={handleSend}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm text-[#6B7280]">Không tìm thấy phiên họp nào phù hợp</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <AppPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemLabel="phiên họp"
          />
        )}
      </main>

      {/* Confirm Action Modal */}
      {confirmModal && (
        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmAction}
          actionType={confirmModal.actionType}
          meetingTitle={confirmModal.meetingTitle}
        />
      )}

      {/* Postpone Modal */}
      {postponeModal && (
        <PostponeModal
          isOpen={postponeModal.isOpen}
          onClose={() => setPostponeModal(null)}
          onConfirm={handleConfirmPostpone}
          meetingId={postponeModal.meetingId}
          oldStartTime={postponeModal.oldStartTime}
          oldEndTime={postponeModal.oldEndTime}
        />
      )}
    </div>
  );
};

export default PhienHopPage;
