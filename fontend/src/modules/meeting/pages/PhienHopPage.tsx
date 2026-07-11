import { Clock, Eye, Plus, Search, Users, CalendarIcon, LayoutGrid, LayoutList } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from '@/lib/toast';
import { useWebSocket } from "@/app/context/WebSocketContext";
import { CustomDropdown } from '@/common/components/ui/custom-dropdown';
import { FilterBar } from '@/common/components/layout/FilterBar';
import { PageHeader } from '@/common/components/layout/PageHeader';
import { Sidebar } from '@/common/components/layout/Sidebar';
import { ConfirmActionModal } from '@/modules/meeting/components/ConfirmActionModal';
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
import { personalApi } from '../services/personal.api';
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
      return ['DRAFT', 'REJECTED'];
    case 'pending':
      return ['PENDING_APPROVAL'];
    case 'approved':
      return ['APPROVED'];
    case 'upcoming':
      return ['UPCOMING'];
    case 'ongoing':
      return ['IN_PROGRESS'];
    case 'completed':
      return ['CLOSED', 'CANCELLED'];
    case 'approved_by_me':
      return ['APPROVED', 'UPCOMING', 'IN_PROGRESS', 'CLOSED', 'CANCELLED', 'REJECTED'];
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
    fromDate: from ? format(from, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
    toDate: to ? format(to, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
  };
};

const TAB_THEMES: Record<string, { dotBg: string; activeBadge: string; inactiveBadge: string }> = {
    all: {
        dotBg: "",
        activeBadge: "bg-red-50 text-[#C8102E]",
        inactiveBadge: "bg-gray-100 text-gray-600",
    },
    ongoing: {
        dotBg: "bg-emerald-500",
        activeBadge: "bg-emerald-50 text-emerald-600",
        inactiveBadge: "bg-emerald-50/20 text-emerald-600",
    },
    approved: {
        dotBg: "bg-teal-500",
        activeBadge: "bg-teal-50 text-teal-600",
        inactiveBadge: "bg-teal-50/20 text-teal-600",
    },
    upcoming: {
        dotBg: "bg-blue-500",
        activeBadge: "bg-blue-50 text-blue-600",
        inactiveBadge: "bg-blue-50/20 text-blue-600",
    },
    draft: {
        dotBg: "bg-amber-500",
        activeBadge: "bg-amber-50 text-amber-600",
        inactiveBadge: "bg-amber-50/20 text-amber-600",
    },
    pending: {
        dotBg: "bg-purple-500",
        activeBadge: "bg-purple-50 text-purple-600",
        inactiveBadge: "bg-purple-50/20 text-purple-600",
    },
    completed: {
        dotBg: "bg-slate-400",
        activeBadge: "bg-slate-100 text-slate-700",
        inactiveBadge: "bg-slate-100/50 text-slate-600",
    },
    approved_by_me: {
        dotBg: "bg-indigo-500",
        activeBadge: "bg-indigo-50 text-indigo-600",
        inactiveBadge: "bg-indigo-50/20 text-indigo-600",
    }
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [tabCounts, setTabCounts] = useState<Record<string, number>>({
        all: 0,
        ongoing: 0,
        approved: 0,
        upcoming: 0,
        draft: 0,
        pending: 0,
        completed: 0,
        approved_by_me: 0,
    });

    const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
    const [customToDate, setCustomToDate] = useState<Date | null>(null);
    const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
    const [tempToDate, setTempToDate] = useState<Date | null>(null);

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const meetingsRef = useRef<Meeting[]>(meetings);
    useEffect(() => {
        meetingsRef.current = meetings;
    }, [meetings]);
    const [rawMeetings, setRawMeetings] = useState<MeetingResponse[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    
    const isApprover = useMemo(() => {
        if (!user) return false;
        const role = user.role?.roleCode;
        if (role === 'SUPER_ADMIN' || role === 'DEPARTMENT_ADMIN') return true;
        const posCode = user.position?.positionCode;
        return [
            PositionCode.CHU_TICH,
            PositionCode.PHO_CHU_TICH,
            PositionCode.GIAM_DOC,
            PositionCode.PHO_GIAM_DOC,
            PositionCode.TRUONG_PHONG,
            PositionCode.PHO_TRUONG_PHONG
        ].includes(posCode as PositionCode);
    }, [user]);

    const tabs = useMemo(() => {
        const list = [
            { value: "all", label: "Tất cả" },
            { value: "ongoing", label: "Đang diễn ra" },
            { value: "approved", label: "Đã phê duyệt" },
            { value: "upcoming", label: "Sắp diễn ra" },
            { value: "draft", label: "Bản nháp" },
            { value: "pending", label: "Chờ phê duyệt" },
            { value: "completed", label: "Đã kết thúc" },
        ];
        if (isApprover) {
            list.push({ value: "approved_by_me", label: "Đã duyệt" });
        }
        return list;
    }, [isApprover]);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        actionType: "cancel" | "send" | "revertToDraft";
        meetingId: string;
        meetingTitle: string;
    } | null>(null);



    const mapMeetingResponseToMeeting = (res: MeetingResponse): Meeting => {
      const statusInfo = STATUS_MAP[res.status] || { label: res.status, variant: "default" as const };
      const start = new Date(res.startTime);
      const end = new Date(res.endTime);
      
      const isSameDay = start.getDate() === end.getDate() &&
                        start.getMonth() === end.getMonth() &&
                        start.getFullYear() === end.getFullYear();
      
      const formattedDate = format(start, 'dd/MM/yyyy');
      const formattedTime = isSameDay
        ? `${formattedDate} ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
        : `${format(start, 'HH:mm dd/MM/yyyy')} - ${format(end, 'HH:mm dd/MM/yyyy')}`;
      
      return {
        id: res.id,
        title: res.title,
        date: formattedDate,
        time: formattedTime,
        location: res.locationName || "Chưa xác định",
        host: res.chairName || "Chưa xác định",
        participants: res.participantsCount || 0,
        documents: res.documentsCount || 0,
        status: statusInfo.label,
        statusVariant: statusInfo.variant,
        
        canEdit: res.canEdit || (
            (res.createdById === user?.id || 
             res.callerRole === 'CREATOR' || 
             res.callerRole === 'SECRETARY') && 
            ['APPROVED', 'PENDING_APPROVAL', 'UPCOMING', 'IN_PROGRESS', 'CLOSED'].includes(res.status)
        ),
        canCancel: res.canCancel,
        canPublish: res.canPublish,
        canDelete: res.canDelete,
        canSubmitApproval: res.canSubmitApproval,
        canUploadDocs: res.canUploadDocs,
        canCopy: res.createdById === user?.id,
        canApprove: res.canApprove,
        rawStatus: res.status,
        isSaved: res.isSaved,
        callerInviteStatus: res.callerInviteStatus,
        callerRole: res.callerRole,
      };
    };

    const fetchMeetings = async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        try {
            const statusFilter = getStatusesForFilter(selectedStatus);
            const { fromDate, toDate } = getTimeRange(selectedTime, customFromDate, customToDate);
            
            const res = await meetingApi.getMeetings({
                page: currentPage - 1,
                size: pageSize,
                keyword: searchQuery.trim() || undefined,
                statuses: selectedStatus === 'approved_by_me' ? undefined : statusFilter,
                approvedByMe: selectedStatus === 'approved_by_me' ? true : undefined,
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
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const updateSingleMeeting = async (meetingId: string) => {
        try {
            const res = await meetingApi.getMeetingById(meetingId);
            if (res.success && res.data) {
                const updatedMeeting = mapMeetingResponseToMeeting(res.data);
                setMeetings(prevMeetings => prevMeetings.map(m => m.id === meetingId ? updatedMeeting : m));
                setRawMeetings(prevRaw => prevRaw.map(m => m.id === meetingId ? res.data : m));
            }
        } catch (error) {
            console.error("Error updating single meeting:", error);
        }
    };

    useEffect(() => {
        if (selectedTime === "custom" && (!customFromDate || !customToDate)) {
            return;
        }
        fetchMeetings();
    }, [currentPage, pageSize, searchQuery, selectedStatus, selectedTime, customFromDate, customToDate]);

    useEffect(() => {
        let debounceTimeout: any = null;
        const unsubscribe = subscribe('/topic/meeting-updates', (message: any) => {
            console.log("WebSocket meeting update received:", message);
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
            debounceTimeout = setTimeout(() => {
                if (message && message.meetingId) {
                    const exists = meetingsRef.current.some(m => m.id === message.meetingId);
                    if (exists) {
                        updateSingleMeeting(message.meetingId);
                        return;
                    }
                }
                fetchMeetings(true);
            }, 300);
        });
        return () => {
            unsubscribe();
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
        };
    }, [subscribe, currentPage, pageSize, searchQuery, selectedStatus, selectedTime, customFromDate, customToDate]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const { fromDate, toDate } = getTimeRange(selectedTime, customFromDate, customToDate);
                const keyword = searchQuery.trim() || undefined;

                const promises: Promise<any>[] = [
                    meetingApi.getMeetings({ page: 0, size: 1, keyword, fromDate, toDate }),
                    meetingApi.getMeetings({ page: 0, size: 1, keyword, statuses: getStatusesForFilter('ongoing'), fromDate, toDate }),
                    meetingApi.getMeetings({ page: 0, size: 1, keyword, statuses: getStatusesForFilter('approved'), fromDate, toDate }),
                    meetingApi.getMeetings({ page: 0, size: 1, keyword, statuses: getStatusesForFilter('upcoming'), fromDate, toDate }),
                    meetingApi.getMeetings({ page: 0, size: 1, keyword, statuses: getStatusesForFilter('draft'), fromDate, toDate }),
                    meetingApi.getMeetings({ page: 0, size: 1, keyword, statuses: getStatusesForFilter('pending'), fromDate, toDate }),
                    meetingApi.getMeetings({ page: 0, size: 1, keyword, statuses: getStatusesForFilter('completed'), fromDate, toDate }),
                ];

                if (isApprover) {
                    promises.push(meetingApi.getMeetings({ page: 0, size: 1, keyword, approvedByMe: true, fromDate, toDate }));
                }

                const results = await Promise.all(promises);

                const counts: Record<string, number> = {
                    all: results[0].success ? results[0].data?.totalElements || 0 : 0,
                    ongoing: results[1].success ? results[1].data?.totalElements || 0 : 0,
                    approved: results[2].success ? results[2].data?.totalElements || 0 : 0,
                    upcoming: results[3].success ? results[3].data?.totalElements || 0 : 0,
                    draft: results[4].success ? results[4].data?.totalElements || 0 : 0,
                    pending: results[5].success ? results[5].data?.totalElements || 0 : 0,
                    completed: results[6].success ? results[6].data?.totalElements || 0 : 0,
                };

                if (isApprover && results[7]) {
                    counts.approved_by_me = results[7].success ? results[7].data?.totalElements || 0 : 0;
                }

                setTabCounts(counts);
            } catch (error) {
                console.error("Error fetching tab counts:", error);
            }
        };

        fetchCounts();
    }, [searchQuery, selectedTime, customFromDate, customToDate, meetings, isApprover]);

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

    const handleToggleSave = async (id: string) => {
        try {
            const res = await personalApi.toggleSaveMeeting(id);
            if (res.success) {
                toast.success(res.data ? "Lưu tài liệu phiên họp thành công" : "Đã hủy lưu tài liệu phiên họp");
                updateSingleMeeting(id);
            } else {
                toast.error("Thất bại", res.message || "Không thể thực hiện hành động.");
            }
        } catch (error) {
            console.error("Error toggling save:", error);
            toast.error("Lỗi", "Đã xảy ra lỗi khi thực hiện.");
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

        let keepModalOpen = false;
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
            } else if (confirmModal.actionType === "revertToDraft") {
                const revertRes = await meetingApi.revertToDraft(confirmModal.meetingId);
                if (revertRes.success) {
                    toast.success("Đã chuyển phiên họp về trạng thái Bản nháp");
                    navigate(`/phien-hop/${confirmModal.meetingId}/cap-nhat`);
                } else {
                    toast.error("Thất bại", revertRes.message || "Không thể chuyển trạng thái phiên họp.");
                }
            } else if (confirmModal.actionType === "send") {
                const rawMeeting = rawMeetings.find(m => m.id === confirmModal.meetingId);
                let timeExpired = false;
                if (rawMeeting?.startTime) {
                    const startTime = new Date(rawMeeting.startTime);
                    const now = new Date();
                    const minAllowedTime = new Date(now.getTime() + 30 * 60 * 1000);
                    if (startTime < minAllowedTime) {
                        timeExpired = true;
                    }
                }

                if (timeExpired) {
                    setConfirmModal({
                        isOpen: true,
                        actionType: "revertToDraft",
                        meetingId: confirmModal.meetingId,
                        meetingTitle: meeting.title,
                    });
                    keepModalOpen = true;
                    return;
                }

                if (meeting.canPublish) {
                    try {
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
                    } catch (error: any) {
                        const isTimeError = error && error.response && error.response.data && error.response.data.code === 1222;
                        if (isTimeError) {
                            setConfirmModal({
                                isOpen: true,
                                actionType: "revertToDraft",
                                meetingId: confirmModal.meetingId,
                                meetingTitle: meeting.title,
                            });
                            keepModalOpen = true;
                        } else {
                            toast.error("Thất bại", error?.response?.data?.message || error?.message || "Không thể công bố phiên họp.");
                        }
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
            if (!keepModalOpen) {
                setConfirmModal(null);
            }
        }
    };

    // Table Config
    const columns = useMemo(() => createMeetingColumns({
        onView: handleViewDetail,
        onUpdate: handleUpdate,
        onCopy: handleCopy,
        onCancel: handleCancel,
        onSend: handleSend,
    }), [meetings, rawMeetings]);

    const rowActions = useMemo(() => createMeetingRowActions({
        onView: handleViewDetail,
        onUpdate: handleUpdate,
        onCopy: handleCopy,
        onCancel: handleCancel,
        onSend: handleSend,
        onUploadDocs: handleUploadDocs,
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
            onCancel={handleCancel}
            onSend={handleSend}
            onUploadDocs={handleUploadDocs}
            onToggleSave={handleToggleSave}
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

                        {/* Tab-based status filter */}
                        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-none gap-2">
                            {tabs.map((tab) => {
                                const isActive = selectedStatus === tab.value;
                                const count = tabCounts[tab.value];
                                const theme = TAB_THEMES[tab.value] || TAB_THEMES.all;
                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus(tab.value);
                                            setCurrentPage(1);
                                        }}
                                        className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                                            isActive 
                                                ? 'border-[#C8102E] text-[#C8102E]' 
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.value !== 'all' && theme && theme.dotBg && (
                                            <span className={`h-2.5 w-2.5 rounded-full ${theme.dotBg} ${tab.value === 'ongoing' ? 'animate-pulse' : ''}`} />
                                        )}
                                        <span>{tab.label}</span>
                                        {theme && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                                                isActive ? theme.activeBadge : theme.inactiveBadge
                                            }`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

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

                                {/* Layout Toggle Grid/List */}
                                <div className="flex items-center border border-gray-200 rounded-xl p-0.5 bg-gray-50 shrink-0 h-10 ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            viewMode === 'grid'
                                                ? 'bg-white text-[#C8102E] shadow-sm font-semibold'
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                        title="Xem dạng thẻ"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            viewMode === 'list'
                                                ? 'bg-white text-[#C8102E] shadow-sm font-semibold'
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                        title="Xem dạng bảng"
                                    >
                                        <LayoutList className="h-4 w-4" />
                                    </button>
                                </div>
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
                                renderCustomRow={viewMode === 'grid' ? renderMeetingCard : undefined}
                                containerClassName="grid grid-cols-1 gap-4 mb-6"
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


        </>
    );
};

export default PhienHopPage;
