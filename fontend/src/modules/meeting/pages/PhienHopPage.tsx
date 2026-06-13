import { Clock, Eye, Plus, Search, Users, CalendarIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from '@/lib/toast';
import { useWebSocket } from "@/app/context/WebSocketContext";
import { CustomDropdown } from '@/common/components/ui/custom-dropdown';
import { FilterBar } from '@/common/components/layout/FilterBar';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { Sidebar } from '@/common/components/layout/Sidebar';
import { ConfirmActionModal } from '@/modules/meeting/components/ConfirmActionModal';
import { PostponeData, PostponeModal } from '@/modules/meeting/components/PostponeModal';
import { PollManagement } from '@/modules/poll/components/PollManagement';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { Card, CardContent } from '@/common/components/ui/card';
import { DataTable } from "@/common/components/table-engine/DataTable";
import { MeetingCard } from "../components/MeetingCard";
import { createMeetingColumns, createMeetingRowActions, Meeting } from "../table/meetingTable.schema";
import { PHIEN_HOP_SIDEBAR_ITEMS } from '@/app/constants/sidebar';

import { useAuth } from '@/app/context/AuthContext';
import { PositionCode } from '@/common/types/position';
import { meetingApi, MeetingResponse } from '../services/meeting.api';
import { Popover, PopoverContent, PopoverTrigger } from '@/common/components/ui/popover';
import { ScrollDatePicker } from '@/common/components/ui/scroll-date-picker';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/common/utils/cn';

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "default" | "destructive" | "secondary" }> = {
  DRAFT: { label: "Nháp", variant: "warning" },
  PENDING_APPROVAL: { label: "Chờ phê duyệt", variant: "warning" },
  APPROVED: { label: "Đã phê duyệt", variant: "info" },
  UPCOMING: { label: "Sắp diễn ra", variant: "info" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "success" },
  CLOSED: { label: "Đã kết thúc", variant: "secondary" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  REJECTED: { label: "Từ chối duyệt", variant: "destructive" },
  EXPIRED: { label: "Hết hạn", variant: "secondary" },
};

const getStatusesForFilter = (status: string) => {
  switch (status) {
    case 'draft':
      return ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'];
    case 'upcoming':
      return ['APPROVED', 'UPCOMING'];
    case 'ongoing':
      return ['IN_PROGRESS'];
    case 'completed':
      return ['CLOSED', 'CANCELLED'];
    default:
      return undefined;
  }
};

const getTimeRange = (timeFilter: string, customFrom: Date | null, customTo: Date | null) => {
  const now = new Date();
  let from: Date | undefined;
  let to: Date | undefined;

  switch (timeFilter) {
    case 'today':
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case 'week':
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    case 'custom':
      if (customFrom) from = startOfDay(customFrom);
      if (customTo) to = endOfDay(customTo);
      break;
    default:
      break;
  }
  return {
    fromDate: from ? from.toISOString() : undefined,
    toDate: to ? to.toISOString() : undefined,
  };
};

const PhienHopPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { subscribe } = useWebSocket();

    const isPollManagement =
        location.pathname === "/phien-hop/phieu-lay-y-kien";

    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedTime, setSelectedTime] = useState<string>("month");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");

    const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
    const [customToDate, setCustomToDate] = useState<Date | null>(null);
    const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
    const [tempToDate, setTempToDate] = useState<Date | null>(null);

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [rawMeetings, setRawMeetings] = useState<MeetingResponse[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        actionType: "cancel" | "send" | "postpone";
        meetingId: string;
        meetingTitle: string;
    } | null>(null);

    const [postponeModal, setPostponeModal] = useState<{
        isOpen: boolean;
        meetingId: string;
        oldStartTime: string;
        oldEndTime: string;
    } | null>(null);

    const mapMeetingResponseToMeeting = (res: MeetingResponse): Meeting => {
      const statusInfo = STATUS_MAP[res.status] || { label: res.status, variant: "default" as const };
      const start = new Date(res.startTime);
      const end = new Date(res.endTime);
      
      const formattedDate = format(start, 'dd/MM/yyyy');
      const formattedTime = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
      
      return {
        id: res.id,
        title: res.title,
        date: formattedDate,
        time: formattedTime,
        location: res.locationName || res.onlineLink || "Chưa xác định",
        host: res.chairName || "Chưa xác định",
        participants: res.participantsCount || 0,
        documents: res.documentsCount || 0,
        status: statusInfo.label,
        statusVariant: statusInfo.variant,
        
        canEdit: res.canEdit,
        canCancel: res.canCancel,
        canPublish: res.canPublish,
        canPostpone: res.canPostpone,
        canDelete: res.canDelete,
        canSubmitApproval: res.canSubmitApproval,
        canUploadDocs: res.canUploadDocs,
        canCopy: res.createdById === user?.id,
        canApprove: res.canApprove,
      };
    };

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const statusFilter = getStatusesForFilter(selectedStatus);
            const { fromDate, toDate } = getTimeRange(selectedTime, customFromDate, customToDate);
            
            const res = await meetingApi.getMeetings({
                page: currentPage - 1,
                size: pageSize,
                keyword: searchQuery.trim() || undefined,
                statuses: statusFilter,
                fromDate,
                toDate
            });
            
            if (res.success && res.data) {
                const mapped = res.data.content.map(mapMeetingResponseToMeeting);
                setMeetings(mapped);
                setRawMeetings(res.data.content);
                setTotalItems(res.data.totalElements);
            } else {
                toast.error("Lỗi", res.message || "Không thể tải danh sách phiên họp.");
            }
        } catch (error) {
            console.error("Error fetching meetings:", error);
            toast.error("Lỗi kết nối", "Đã xảy ra lỗi khi kết nối đến máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTime === "custom" && (!customFromDate || !customToDate)) {
            return;
        }
        fetchMeetings();
    }, [currentPage, pageSize, searchQuery, selectedStatus, selectedTime, customFromDate, customToDate]);

    useEffect(() => {
        const unsubscribe = subscribe('/topic/meeting-updates', (message) => {
            console.log("WebSocket meeting update received:", message);
            fetchMeetings();
        });
        return () => {
            unsubscribe();
        };
    }, [subscribe, currentPage, pageSize, searchQuery, selectedStatus, selectedTime, customFromDate, customToDate]);

    // Action handlers
    const handleViewDetail = (id: string) => {
        navigate(`/phien-hop/${id}`);
    };

    const handleUpdate = (id: string) => {
        navigate(`/phien-hop/${id}/cap-nhat`);
    };

    const handleCopy = (id: string) => {
        navigate('/phien-hop/tao-moi', { state: { copyFromId: id } });
    };

    const handleUploadDocs = (id: string) => {
        navigate(`/phien-hop/${id}/up-tai-lieu`);
    };

    const handlePostpone = (id: string) => {
        const rawMeeting = rawMeetings.find(m => m.id === id);
        if (!rawMeeting) return;

        setPostponeModal({
            isOpen: true,
            meetingId: id,
            oldStartTime: rawMeeting.startTime,
            oldEndTime: rawMeeting.endTime,
        });
    };

    const handleConfirmPostpone = async (data: PostponeData) => {
        if (!postponeModal) return;
        try {
            const res = await meetingApi.postponeMeeting(postponeModal.meetingId, {
                newStartTime: data.newStartTime,
                newEndTime: data.newEndTime,
                reason: data.reason
            });

            if (res.success) {
                toast.success(
                    "Hoãn phiên họp thành công",
                    `Phiên họp đã được hoãn sang thời gian mới`
                );
                setPostponeModal(null);
                fetchMeetings();
            } else {
                toast.error("Thất bại", res.message || "Không thể hoãn phiên họp.");
            }
        } catch (error) {
            console.error("Error postponing meeting:", error);
            toast.error("Lỗi", "Đã xảy ra lỗi khi hoãn phiên họp.");
        }
    };

    const handleCancel = (id: string) => {
        const meeting = meetings.find((m) => m.id === id);
        if (!meeting) return;
        setConfirmModal({
            isOpen: true,
            actionType: "cancel",
            meetingId: id,
            meetingTitle: meeting.title,
        });
    };

    const handleSend = (id: string) => {
        const meeting = meetings.find((m) => m.id === id);
        if (!meeting) return;
        setConfirmModal({
            isOpen: true,
            actionType: "send",
            meetingId: id,
            meetingTitle: meeting.title,
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmModal) return;

        const meeting = meetings.find(
            (m) => m.id === confirmModal.meetingId,
        );
        if (!meeting) return;

        try {
            if (confirmModal.actionType === "cancel") {
                const res = await meetingApi.cancelMeeting(confirmModal.meetingId, "Hủy phiên họp theo yêu cầu của người tạo");
                if (res.success) {
                    toast.success(
                        "Hủy phiên họp thành công",
                        `Đã hủy phiên họp "${meeting.title}"`
                    );
                    fetchMeetings();
                } else {
                    toast.error("Thất bại", res.message || "Không thể hủy phiên họp.");
                }
            } else if (confirmModal.actionType === "send") {
                if (meeting.canPublish) {
                    const res = await meetingApi.publishMeeting(confirmModal.meetingId);
                    if (res.success) {
                        toast.success(
                            "Công bố phiên họp thành công",
                            `Đã công bố phiên họp "${meeting.title}"`
                        );
                        fetchMeetings();
                    } else {
                        toast.error("Thất bại", res.message || "Không thể công bố phiên họp.");
                    }
                } else {
                    const res = await meetingApi.submitApproval(confirmModal.meetingId);
                    if (res.success) {
                        toast.success(
                            "Gửi duyệt phiên họp thành công",
                            `Đã gửi duyệt phiên họp "${meeting.title}"`
                        );
                        fetchMeetings();
                    } else {
                        toast.error("Thất bại", res.message || "Không thể gửi duyệt phiên họp.");
                    }
                }
            }
        } catch (error) {
            console.error("Error executing action:", error);
            toast.error("Lỗi", "Đã xảy ra lỗi khi thực hiện hành động.");
        } finally {
            setConfirmModal(null);
        }
    };

    // Table Config
    const columns = useMemo(() => createMeetingColumns({
        onView: handleViewDetail,
        onUpdate: handleUpdate,
        onCopy: handleCopy,
        onPostpone: handlePostpone,
        onCancel: handleCancel,
        onSend: handleSend,
    }), [meetings, rawMeetings]);

    const rowActions = useMemo(() => createMeetingRowActions({
        onView: handleViewDetail,
        onUpdate: handleUpdate,
        onCopy: handleCopy,
        onPostpone: handlePostpone,
        onCancel: handleCancel,
        onSend: handleSend,
    }), [meetings, rawMeetings]);

    const tableConfig = {
        columns,
        rowActions,
    };

    const renderMeetingCard = (meetingItem: any) => (
        <MeetingCard
            key={meetingItem.id}
            meeting={meetingItem as Meeting}
            onViewDetail={handleViewDetail}
            onUpdate={handleUpdate}
            onCopy={handleCopy}
            onPostpone={handlePostpone}
            onCancel={handleCancel}
            onSend={handleSend}
            onUploadDocs={handleUploadDocs}
        />
    );

    const hasCreatePermission = useMemo(() => {
        if (!user) return false;
        const role = user.role?.roleCode;
        if (role === 'SUPER_ADMIN' || role === 'DEPARTMENT_ADMIN') return true;
        const posCode = user.position?.positionCode;
        return posCode === PositionCode.THU_KY;
    }, [user]);

    return (
        <>
            {isPollManagement ? (
                <PollManagement />
            ) : (
                <div className="p-8">
                        <PageHeader
                            title="Quản lý phiên họp"
                            description="Danh sách các phiên họp và cuộc họp sắp tới"
                            breadcrumbs={[
                                { name: "Trang chủ", path: "/" },
                                { name: "Phiên họp" },
                            ]}
                            actions={
                                hasCreatePermission ? (
                                    <Link to="/phien-hop/tao-moi">
                                        <Button
                                            variant="primary"
                                            size="default"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tạo phiên họp
                                        </Button>
                                    </Link>
                                ) : undefined
                            }
                        />

                        <FilterBar>
                            <div className="flex items-center gap-3 flex-1 flex-wrap">
                                {/* Enhanced Search Input */}
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Tìm kiếm theo tên phiên họp, chủ trì..."
                                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] hover:border-[#C8102E]/30 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-all"
                                    />
                                </div>

                                {/* Status Filter Dropdown */}
                                <CustomDropdown
                                    className="shrink-0 w-48"
                                    options={[
                                        { value: "all", label: "Tất cả trạng thái" },
                                        { value: "draft", label: "Nháp" },
                                        { value: "upcoming", label: "Sắp diễn ra" },
                                        { value: "ongoing", label: "Đang diễn ra" },
                                        { value: "completed", label: "Đã kết thúc" },
                                    ]}
                                    value={selectedStatus}
                                    onChange={(val) => {
                                        setSelectedStatus(val);
                                        setCurrentPage(1);
                                    }}
                                />

                                {/* Time Filter Dropdown */}
                                <CustomDropdown
                                    className="shrink-0 w-36"
                                    options={[
                                        { value: "month", label: "Tháng" },
                                        { value: "week", label: "Tuần" },
                                        { value: "today", label: "Hôm nay" },
                                        { value: "custom", label: "Tùy chọn" },
                                    ]}
                                    value={selectedTime}
                                    onChange={(val) => {
                                        setSelectedTime(val);
                                        if (val !== "custom") {
                                            setCustomFromDate(null);
                                            setCustomToDate(null);
                                            setTempFromDate(null);
                                            setTempToDate(null);
                                            setCurrentPage(1);
                                        }
                                    }}
                                />

                                {/* Custom Time Pickers using ScrollDatePicker & Popover */}
                                {selectedTime === "custom" && (
                                    <div className="flex items-center gap-2 animate-in fade-in-0 duration-200">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="border-gray-300 rounded-xl px-4 py-2 text-sm bg-white text-gray-700 hover:border-[#C8102E]/30 flex items-center gap-2 h-10">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    Từ: {tempFromDate ? format(tempFromDate, 'dd/MM/yyyy') : 'Chọn ngày bắt đầu'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 z-50">
                                                <ScrollDatePicker value={tempFromDate || undefined} onChange={(date) => { setTempFromDate(date); }} showTime={false} />
                                            </PopoverContent>
                                        </Popover>
                                        <span className="text-gray-400">-</span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="border-gray-300 rounded-xl px-4 py-2 text-sm bg-white text-gray-700 hover:border-[#C8102E]/30 flex items-center gap-2 h-10">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    Đến: {tempToDate ? format(tempToDate, 'dd/MM/yyyy') : 'Chọn ngày kết thúc'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 z-50">
                                                <ScrollDatePicker value={tempToDate || undefined} onChange={(date) => { setTempToDate(date); }} showTime={false} />
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            variant="primary"
                                            disabled={!tempFromDate || !tempToDate}
                                            onClick={() => {
                                                setCustomFromDate(tempFromDate);
                                                setCustomToDate(tempToDate);
                                                setCurrentPage(1);
                                            }}
                                            className="rounded-xl px-4 py-2 text-sm h-10 bg-[#C8102E] hover:bg-[#C8102E]/90 text-white disabled:bg-gray-200 disabled:text-gray-400"
                                        >
                                            Lọc
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </FilterBar>

                        {/* Meetings List */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#C8102E] border-r-transparent mb-4"></div>
                                <p className="text-gray-500 text-sm font-medium">Đang tải danh sách phiên họp...</p>
                            </div>
                        ) : (
                            <DataTable
                                data={meetings}
                                config={tableConfig}
                                renderCustomRow={renderMeetingCard}
                                containerClassName="space-y-4 mb-6"
                                currentPage={currentPage}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                            />
                        )}
                    </div>
                )}

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
        </>
    );
};

export default PhienHopPage;
