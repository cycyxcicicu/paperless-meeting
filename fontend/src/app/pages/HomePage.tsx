import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, MapPin, User, Calendar, Shield, Users, Landmark, FileText, ArrowRight, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { TableTooltip } from '@/common/components/table-engine/TableTooltip';
import { useAuth } from '@/app/context/AuthContext';
import { useNavigate, Link } from 'react-router';
import { meetingApi, MeetingResponse } from '@/modules/meeting/services/meeting.api';
import { userApi } from '@/modules/user/services/user.api';
import { departmentApi } from '@/modules/organization/services/department.api';
import { toast } from '@/lib/toast';
import { useWebSocket } from '@/app/context/WebSocketContext';
import { format } from 'date-fns';
import { getErrorMessage } from '@/lib/api/error';

interface TabState {
  meetings: MeetingResponse[];
  page: number;
  loading: boolean;
  hasMore: boolean;
  totalElements: number;
}

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribe } = useWebSocket();

  // Phân chia state phân trang độc lập cho từng Tab
  const [ongoingState, setOngoingState] = useState<TabState>({
    meetings: [],
    page: 0,
    loading: false,
    hasMore: true,
    totalElements: 0,
  });

  const [upcomingState, setUpcomingState] = useState<TabState>({
    meetings: [],
    page: 0,
    loading: false,
    hasMore: true,
    totalElements: 0,
  });

  const [unconfirmedState, setUnconfirmedState] = useState<TabState>({
    meetings: [],
    page: 0,
    loading: false,
    hasMore: true,
    totalElements: 0,
  });

  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'unconfirmed'>('ongoing');

  // State lưu trữ dữ liệu cuộc họp sidebar (đã được lọc từ backend)
  const [approvalMeetings, setApprovalMeetings] = useState<MeetingResponse[]>([]);
  const [preparationMeetings, setPreparationMeetings] = useState<MeetingResponse[]>([]);
  const [adminStats, setAdminStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalUnits: number;
    activeUnits: number;
  } | null>(null);

  const isSuperAdmin = user?.role?.roleCode === 'SUPER_ADMIN';
  const isDeptAdmin = user?.role?.roleCode === 'DEPARTMENT_ADMIN';
  const isAdminOrDeptAdmin = isSuperAdmin || isDeptAdmin;

  // Sử dụng Refs để lưu trữ trạng thái mới nhất của các tab, tránh stale closures khi scroll
  const ongoingRef = useRef(ongoingState);
  const upcomingRef = useRef(upcomingState);
  const unconfirmedRef = useRef(unconfirmedState);

  useEffect(() => { ongoingRef.current = ongoingState; }, [ongoingState]);
  useEffect(() => { upcomingRef.current = upcomingState; }, [upcomingState]);
  useEffect(() => { unconfirmedRef.current = unconfirmedState; }, [unconfirmedState]);

  // Hàm tải dữ liệu cuộc họp phân trang của từng Tab từ backend
  const fetchTabMeetings = async (tab: 'ongoing' | 'upcoming' | 'unconfirmed', isRefresh: boolean = false, silent: boolean = false) => {
    const currentState = tab === 'ongoing' 
      ? ongoingRef.current 
      : tab === 'upcoming' 
        ? upcomingRef.current 
        : unconfirmedRef.current;

    if (currentState.loading || (!currentState.hasMore && !isRefresh)) {
      return;
    }

    const setTargetState = tab === 'ongoing' 
      ? setOngoingState 
      : tab === 'upcoming' 
        ? setUpcomingState 
        : setUnconfirmedState;

    const nextPage = isRefresh ? 0 : currentState.page;

    if (!silent) {
      setTargetState(prev => ({ ...prev, loading: true }));
    }

    try {
      let res;
      if (tab === 'ongoing') {
        res = await meetingApi.getMeetings({
          page: nextPage,
          size: 10,
          statuses: ['IN_PROGRESS'],
          onlyMyMeetings: true,
          inviteStatus: 'ACCEPTED'
        });
      } else if (tab === 'upcoming') {
        res = await meetingApi.getMeetings({
          page: nextPage,
          size: 10,
          statuses: ['APPROVED', 'UPCOMING'],
          onlyMyMeetings: true,
          inviteStatus: 'ACCEPTED'
        });
      } else {
        res = await meetingApi.getMeetings({
          page: nextPage,
          size: 10,
          statuses: ['UPCOMING', 'IN_PROGRESS'],
          inviteStatus: 'PENDING',
          onlyMyMeetings: true
        });
      }

      if (res.success && res.data) {
        const newMeetings = res.data.content;
        const isLast = res.data.last;

        setTargetState(prev => {
          const existingMeetings = isRefresh ? [] : prev.meetings;
          const combined = [...existingMeetings, ...newMeetings];
          const unique = combined.filter((m, index, self) =>
            self.findIndex(t => t.id === m.id) === index
          );

          return {
            meetings: unique,
            page: nextPage + 1,
            loading: false,
            hasMore: !isLast && newMeetings.length > 0,
            totalElements: res.data.totalElements || 0
          };
        });
      } else {
        setTargetState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error(`Error fetching ${tab} meetings:`, error);
      setTargetState(prev => ({ ...prev, loading: false }));
    }
  };

  // Lấy dữ liệu sidebar: Cuộc họp cần phê duyệt (đã lọc từ backend)
  const fetchSidebarApproval = async () => {
    try {
      const res = await meetingApi.getSidebarApprovalMeetings();
      if (res.success && res.data) {
        setApprovalMeetings(res.data);
      }
    } catch (error) {
      console.error('Error fetching sidebar approval meetings:', error);
    }
  };

  // Lấy dữ liệu sidebar: Tài liệu cần xử lý (đã lọc từ backend)
  const fetchSidebarDocTasks = async () => {
    try {
      const res = await meetingApi.getSidebarDocTaskMeetings();
      if (res.success && res.data) {
        setPreparationMeetings(res.data);
      }
    } catch (error) {
      console.error('Error fetching sidebar doc-task meetings:', error);
    }
  };

  // Lấy thống kê hệ thống (dành cho Admin)
  const fetchAdminStats = async () => {
    if (!isSuperAdmin) return;
    try {
      const [userRes, deptRes] = await Promise.all([
        userApi.getStats(),
        departmentApi.getStats()
      ]);
      if (userRes.success && deptRes.success) {
        setAdminStats({
          totalUsers: userRes.data?.totalUsers || 0,
          activeUsers: userRes.data?.activeUsers || 0,
          totalUnits: deptRes.data?.totalUnits || 0,
          activeUnits: deptRes.data?.activeUnits || 0
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  // Làm mới toàn bộ dữ liệu trang chủ
  const handleRefreshAll = (silent = false) => {
    fetchSidebarApproval();
    fetchSidebarDocTasks();
    fetchAdminStats();
    fetchTabMeetings('ongoing', true, silent);
    fetchTabMeetings('upcoming', true, silent);
    fetchTabMeetings('unconfirmed', true, silent);
  };

  useEffect(() => {
    handleRefreshAll();
  }, [user]);

  // Đăng ký WebSocket
  useEffect(() => {
    let debounceTimeout: any = null;
    const unsubscribeWs = subscribe('/topic/meeting-updates', (message) => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        handleRefreshAll(true);
      }, 300);
    });
    return () => {
      unsubscribeWs();
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [subscribe]);

  // Xử lý sự kiện cuộn container danh sách cuộc họp (Lazy Load 80%)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= 0.8 * scrollHeight) {
      fetchTabMeetings(activeTab);
    }
  };

  // Trả về trực tiếp danh sách cuộc họp của tab hiện tại (đã được lọc từ backend)
  const displayMeetings = useMemo(() => {
    if (activeTab === 'ongoing') {
      return ongoingState.meetings;
    }
    if (activeTab === 'upcoming') {
      return upcomingState.meetings;
    }
    return unconfirmedState.meetings;
  }, [activeTab, ongoingState.meetings, upcomingState.meetings, unconfirmedState.meetings]);

  // Danh sách sidebar: Dữ liệu đã được lọc từ backend, không cần filter ở frontend

  // Định nghĩa Thống kê (Stats counters)
  const stats = useMemo(() => {
    if (isSuperAdmin && adminStats) {
      return [
        {
          label: 'Tổng người dùng',
          value: adminStats.totalUsers,
          subLabel: `${adminStats.activeUsers} hoạt động`,
          icon: Users,
          bgColor: 'from-blue-50 to-blue-100/50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
        },
        {
          label: 'Đơn vị phòng ban',
          value: adminStats.totalUnits,
          subLabel: `${adminStats.activeUnits} hoạt động`,
          icon: Landmark,
          bgColor: 'from-purple-50 to-purple-100/50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
        },
        {
          label: 'Chờ phê duyệt',
          value: approvalMeetings.length,
          subLabel: 'Cuộc họp cần duyệt',
          icon: Calendar,
          bgColor: 'from-amber-50 to-amber-100/50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
        },
        {
          label: 'Đang diễn ra',
          value: ongoingState.totalElements,
          subLabel: 'Vào phòng họp ngay',
          icon: Clock,
          bgColor: 'from-green-50 to-green-100/50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
        },
      ];
    }

    return [
      {
        label: 'Đang diễn ra',
        value: ongoingState.totalElements,
        subLabel: 'Vào họp ngay',
        icon: Clock,
        bgColor: 'from-green-50 to-green-100/50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
      },
      {
        label: 'Sắp diễn ra',
        value: upcomingState.totalElements,
        subLabel: 'Lịch họp đã nhận',
        icon: Calendar,
        bgColor: 'from-blue-50 to-blue-100/50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
      },
      {
        label: 'Chưa xác nhận',
        value: unconfirmedState.totalElements,
        subLabel: 'Yêu cầu RSVP',
        icon: AlertCircle,
        bgColor: 'from-amber-50 to-amber-100/50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
      },
      {
        label: 'Tài liệu cần xử lý',
        value: preparationMeetings.length,
        subLabel: 'Tải lên hoặc phê duyệt',
        icon: FileText,
        bgColor: 'from-purple-50 to-purple-100/50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-700',
      },
    ];
  }, [isSuperAdmin, adminStats, approvalMeetings.length, preparationMeetings.length, ongoingState.totalElements, upcomingState.totalElements, unconfirmedState.totalElements]);

  const formatTime = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}, ${format(start, 'dd/MM/yyyy')}`;
    } catch {
      return 'Chưa xác định';
    }
  };

  // Xác nhận tham gia
  const handleAcceptInvite = async (meetingId: string) => {
    if (!user?.id) return;
    try {
      const res = await meetingApi.updateInviteStatus(meetingId, user.id, {
        inviteStatus: 'ACCEPTED',
      });
      if (res.success) {
        toast.success('Xác nhận tham gia cuộc họp thành công!');
        handleRefreshAll();
      } else {
        toast.error('Thất bại', res.message || 'Không thể xác nhận tham gia.');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('Lỗi', getErrorMessage(error, 'Đã xảy ra lỗi khi xác nhận tham gia.'));
    }
  };

  // Từ chối tham gia
  const handleDeclineInvite = async (meetingId: string) => {
    if (!user?.id) return;
    const reason = prompt('Vui lòng nhập lý do từ chối tham gia (nếu có):');
    if (reason === null) return;
    try {
      const res = await meetingApi.updateInviteStatus(meetingId, user.id, {
        inviteStatus: 'DECLINED',
        declineReason: reason || undefined,
      });
      if (res.success) {
        toast.success('Đã từ chối tham gia cuộc họp.');
        handleRefreshAll();
      } else {
        toast.error('Thất bại', res.message || 'Không thể từ chối tham gia.');
      }
    } catch (error) {
      console.error('Error declining invite:', error);
      toast.error('Lỗi', getErrorMessage(error, 'Đã xảy ra lỗi khi từ chối tham gia.'));
    }
  };

  // Phê duyệt nhanh cuộc họp
  const handleApproveMeeting = async (meetingId: string) => {
    try {
      const res = await meetingApi.approveMeeting(meetingId);
      if (res.success) {
        toast.success('Phê duyệt cuộc họp thành công!');
        handleRefreshAll();
      } else {
        toast.error('Thất bại', res.message || 'Không thể phê duyệt.');
      }
    } catch (error) {
      console.error('Error approving meeting:', error);
      toast.error('Lỗi', getErrorMessage(error, 'Không thể phê duyệt cuộc họp.'));
    }
  };

  // Từ chối duyệt nhanh cuộc họp
  const handleRejectMeeting = async (meetingId: string) => {
    const reason = prompt('Nhập lý do từ chối phê duyệt cuộc họp:');
    if (!reason) return;
    try {
      const res = await meetingApi.rejectMeeting(meetingId, reason);
      if (res.success) {
        toast.success('Đã từ chối phê duyệt cuộc họp.');
        handleRefreshAll();
      } else {
        toast.error('Thất bại', res.message || 'Không thể từ chối cuộc họp.');
      }
    } catch (error) {
      console.error('Error rejecting meeting:', error);
      toast.error('Lỗi', getErrorMessage(error, 'Không thể từ chối cuộc họp.'));
    }
  };

  const MeetingCard = ({ meeting }: { meeting: MeetingResponse }) => (
    <div
      onClick={() => navigate(`/phien-hop/${meeting.id}`)}
      className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300/70 transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#C8102E] to-[#8a0a1e] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-semibold text-gray-900 group-hover:text-[#C8102E] transition-colors duration-250 line-clamp-2 flex-1">
            {meeting.title}
          </h4>
          {meeting.status === 'IN_PROGRESS' && (
            <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0 text-xs py-0.5 px-2">
              Đang diễn ra
            </Badge>
          )}
          {(meeting.status === 'APPROVED' || meeting.status === 'UPCOMING') && (
            <Badge className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0 text-xs py-0.5 px-2">
              Sắp diễn ra
            </Badge>
          )}
          {meeting.status === 'DRAFT' && (
            <Badge className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0 text-xs py-0.5 px-2">
              Bản nháp
            </Badge>
          )}
          {meeting.status === 'REJECTED' && (
            <Badge className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-50 shrink-0 text-xs py-0.5 px-2">
              Từ chối duyệt
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">{formatTime(meeting.startTime, meeting.endTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">Chủ trì: {meeting.chairName || 'Chưa xác định'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">{meeting.locationName || meeting.onlineLink || 'Chưa xác định'}</span>
          </div>
        </div>

        {meeting.callerInviteStatus === 'PENDING' && (
          <div
            className="flex gap-2 pt-2 border-t border-gray-50 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => handleAcceptInvite(meeting.id)}
              className="text-xs px-3 py-1.5 h-auto bg-[#C8102E] hover:bg-[#a80d26] text-white flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Xác nhận tham gia
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeclineInvite(meeting.id)}
              className="text-xs px-3 py-1.5 h-auto border-gray-300 hover:bg-rose-50 text-gray-700 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Từ chối
            </Button>
          </div>
        )}

        {meeting.status === 'IN_PROGRESS' ? (
          <div 
            className="pt-2 border-t border-gray-50 mt-2 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {meeting.callerAttendanceStatus && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-gray-700">Điểm danh của bạn:</span>
                {meeting.callerAttendanceStatus === 'PRESENT' ? (
                  <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs py-0.5 px-2 font-medium">
                    Đã điểm danh
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-50 text-xs py-0.5 px-2 font-medium">
                    Chưa điểm danh
                  </Badge>
                )}
              </div>
            )}

            {meeting.pendingAttendanceParticipants && meeting.pendingAttendanceParticipants.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="font-semibold text-gray-700 shrink-0">Chưa điểm danh:</span>
                <TableTooltip
                  text={meeting.pendingAttendanceParticipants.join(', ')}
                  maxLength={45}
                  className="truncate text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium"
                />
              </div>
            )}
          </div>
        ) : (
          meeting.callerInviteStatus !== 'PENDING' && (() => {
            const isCreator = meeting.createdById === user?.id || meeting.callerRole === 'CREATOR';
            const isSecretary = meeting.callerRole === 'SECRETARY';
            const isChair = meeting.callerRole === 'CHAIR';
            const canSeeUnconfirmed = isSuperAdmin || isDeptAdmin || isCreator || isSecretary || isChair;

            if (canSeeUnconfirmed) {
              return meeting.pendingParticipants && meeting.pendingParticipants.length > 0 ? (
                <div 
                  className="pt-2 border-t border-gray-50 mt-2 text-xs text-gray-500 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-semibold text-gray-700 shrink-0">Chưa xác nhận:</span>
                  <TableTooltip
                    text={meeting.pendingParticipants.join(', ')}
                    maxLength={45}
                    className="truncate text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-medium"
                  />
                </div>
              ) : null;
            } else {
              if (meeting.callerInviteStatus === 'ACCEPTED') {
                return (
                  <div className="pt-2 border-t border-gray-50 mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-semibold shrink-0">Đã xác nhận tham gia</span>
                  </div>
                );
              } else if (meeting.callerInviteStatus === 'DECLINED') {
                return (
                  <div className="pt-2 border-t border-gray-50 mt-2 text-xs text-rose-600 flex items-center gap-1">
                    <X className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-semibold shrink-0">Đã từ chối tham gia</span>
                  </div>
                );
              }
              return null;
            }
          })()
        )}
      </div>
    </div>
  );

  const activeTabState = activeTab === 'ongoing' ? ongoingState : activeTab === 'upcoming' ? upcomingState : unconfirmedState;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/30 min-h-screen">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Statistics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} rounded-2xl p-6 transition-all duration-300 hover:shadow-md flex items-center justify-between`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-4xl font-extrabold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.subLabel}</p>
                </div>
                <div className={`p-4 rounded-xl bg-white/70 shadow-sm border border-white/50 ${stat.textColor}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cột Trái: Danh sách cuộc họp của tôi (70%) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[600px] lg:h-[750px]">
              
              {/* Header Tab */}
              <div className="border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-1 p-2">
                  <button
                    onClick={() => setActiveTab('ongoing')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'ongoing'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Đang diễn ra ({ongoingState.totalElements})
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'upcoming'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Sắp diễn ra ({upcomingState.totalElements})
                  </button>
                  <button
                    onClick={() => setActiveTab('unconfirmed')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'unconfirmed'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Chưa xác nhận ({unconfirmedState.totalElements})
                  </button>
                </div>
              </div>

              {/* Danh sách cuộn Lazy Load */}
              <div className="flex-1 overflow-hidden p-6">
                {displayMeetings.length === 0 && activeTabState.loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#C8102E] border-r-transparent mb-4"></div>
                    <p className="text-gray-500 text-sm">Đang tải danh sách cuộc họp...</p>
                  </div>
                ) : displayMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border border-gray-150 mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900 mb-1">Không có cuộc họp nào</p>
                    <p className="text-sm text-gray-500">Chưa có lịch họp thuộc danh mục này.</p>
                  </div>
                ) : (
                  <div 
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50"
                  >
                    {displayMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                    {activeTabState.loading && (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#C8102E] border-r-transparent"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột Phải: Các Widget tác vụ nhanh (Luôn hiển thị 2 Card) */}
          <div className="space-y-6">
            
            {/* Widget 1: Cuộc họp cần phê duyệt */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[360px]">
              <div className="px-6 py-4 border-b border-gray-200 shrink-0 flex justify-between items-center bg-amber-50/30 rounded-t-2xl">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600" /> Cuộc họp cần phê duyệt
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Yêu cầu duyệt thông tin cuộc họp</p>
                </div>
                <Badge className="bg-amber-100 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold">
                  {approvalMeetings.length}
                </Badge>
              </div>
              
              <div className="flex-1 overflow-hidden p-4">
                {approvalMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Check className="h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-xs font-medium text-gray-500">Không có cuộc họp cần phê duyệt</p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
                    {approvalMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="bg-white border border-gray-150 rounded-xl p-4 hover:shadow-md hover:border-amber-300/70 transition-all duration-200 space-y-3"
                      >
                        <div>
                          <h4
                            onClick={() => navigate(`/phien-hop/${meeting.id}`)}
                            className="text-sm font-semibold text-gray-900 hover:text-[#C8102E] cursor-pointer line-clamp-1"
                          >
                            {meeting.title}
                          </h4>
                          <span className="text-[11px] text-gray-500 block mt-1">
                            Người tạo: {meeting.createdByName || 'Chưa rõ'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600 border-t border-gray-50 pt-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatTime(meeting.startTime, meeting.endTime)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button
                            onClick={() => handleApproveMeeting(meeting.id)}
                            className="text-xs px-2.5 py-1.5 h-auto bg-emerald-600 hover:bg-emerald-700 text-white flex-1 flex items-center justify-center gap-1"
                          >
                            <Check className="h-3 w-3" /> Phê duyệt
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRejectMeeting(meeting.id)}
                            className="text-xs px-2.5 py-1.5 h-auto border-gray-300 hover:bg-rose-50 text-gray-700 flex-1 flex items-center justify-center gap-1"
                          >
                            <X className="h-3 w-3" /> Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Widget 2: Tài liệu cần xử lý (Tải lên + Phê duyệt) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[360px]">
              <div className="px-6 py-4 border-b border-gray-200 shrink-0 flex justify-between items-center bg-blue-50/30 rounded-t-2xl">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" /> Tài liệu cần xử lý
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tải lên hoặc phê duyệt tài liệu cuộc họp</p>
                </div>
                <Badge className="bg-blue-100 border border-blue-200 text-blue-800 hover:bg-blue-100 text-xs font-bold">
                  {preparationMeetings.length}
                </Badge>
              </div>

              <div className="flex-1 overflow-hidden p-4">
                {preparationMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <FileText className="h-8 w-8 text-blue-400 mb-2" />
                    <p className="text-xs font-medium text-gray-500">Không có tài liệu cần xử lý</p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
                    {preparationMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="bg-white border border-gray-150 rounded-xl p-4 hover:shadow-md hover:border-blue-300/70 transition-all duration-200 space-y-3"
                      >
                        <h4
                          onClick={() => navigate(`/phien-hop/${meeting.id}`)}
                          className="text-sm font-semibold text-gray-900 hover:text-[#C8102E] cursor-pointer line-clamp-1"
                        >
                          {meeting.title}
                        </h4>

                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatTime(meeting.startTime, meeting.endTime)}</span>
                          </div>
                          {meeting.canApproveDocs && (
                            <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>{meeting.pendingApprovalCount} đầu mục chờ phê duyệt tài liệu</span>
                            </div>
                          )}
                           {/* Chi tiết số lượng tài liệu của tôi */}
                          {(meeting.myDocPendingCount !== undefined && 
                            (meeting.myDocPendingCount > 0 || 
                             meeting.myDocSubmittedCount > 0 || 
                             meeting.myDocRejectedCount > 0 || 
                             meeting.myDocApprovedCount > 0)) && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {meeting.myDocPendingCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-200 font-medium">
                                  Cần chuẩn bị: {meeting.myDocPendingCount}
                                </span>
                              )}
                              {meeting.myDocRejectedCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100 font-medium">
                                  Bị từ chối: {meeting.myDocRejectedCount}
                                </span>
                              )}
                              {meeting.myDocSubmittedCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 font-medium">
                                  Chờ duyệt: {meeting.myDocSubmittedCount}
                                </span>
                              )}
                              {meeting.myDocApprovedCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-medium">
                                  Đã duyệt: {meeting.myDocApprovedCount}
                                </span>
                              )}
                            </div>
                          )}

                          {meeting.docPreparationStatus === 'SUBMITTED' && (
                            <div className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50/70 px-2 py-1 rounded-md border border-blue-100 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                              <span>Đã nộp tài liệu, chờ phê duyệt</span>
                            </div>
                          )}
                          {meeting.docPreparationStatus === 'REJECTED' && meeting.docPreparationRejectReason && (
                            <div className="text-[11px] text-rose-600 bg-rose-50/70 px-2 py-1 rounded-md border border-rose-100 mt-1 break-words">
                              <span className="font-semibold block text-xs mb-0.5">Tài liệu bị từ chối duyệt</span>
                              Lý do: {meeting.docPreparationRejectReason}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {meeting.canApproveDocs && (
                            <Button
                              onClick={() => navigate(`/phien-hop/${meeting.id}/cap-nhat#noi-dung`)}
                              className="text-xs px-3 py-2 h-auto bg-amber-600 hover:bg-amber-700 text-white flex-1 flex items-center justify-center gap-1.5"
                            >
                              Phê duyệt tài liệu <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                          {meeting.canUploadDocs && (
                            <Button
                              onClick={() => navigate(`/phien-hop/${meeting.id}/up-tai-lieu`)}
                              className="text-xs px-3 py-2 h-auto bg-blue-600 hover:bg-blue-700 text-white flex-1 flex items-center justify-center gap-1.5"
                            >
                              Tải lên tài liệu <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default HomePage;
