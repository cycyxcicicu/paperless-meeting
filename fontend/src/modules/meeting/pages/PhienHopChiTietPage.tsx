import { useAuth } from "@/app/context/AuthContext";
import { PageHeader } from "@/common/components/layout/PageHeader";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/common/components/ui/dialog";
import { cn } from "@/common/utils/cn";
import { viewDocument, downloadDocument } from "@/common/utils/fileHelpers";
import { ConfirmActionModal } from "@/modules/meeting/components/ConfirmActionModal";
import { ConfirmAttendanceModal } from "@/modules/meeting/components/ConfirmAttendanceModal";
import { ManageParticipantsModal } from "@/modules/meeting/components/ManageParticipantsModal";
import { ThanhPhanThamDuData } from "@/modules/meeting/components/ThanhPhanThamDuStep";
import {
    ArrowLeft,
    Check,
    CalendarClock,
    CalendarX,
} from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { toast } from "sonner";
import { meetingApi } from "../services/meeting.api";

// Import sub-components and hooks
import { MeetingInfoSection } from "../components/chi-tiet/MeetingInfoSection";
import { MeetingDocumentSection } from "../components/chi-tiet/MeetingDocumentSection";
import { MeetingMotionSection } from "../components/chi-tiet/MeetingMotionSection";
import { MeetingSpeakerRegistrationSection } from "../components/chi-tiet/MeetingSpeakerRegistrationSection";
import { MeetingOpinionSection } from "../components/chi-tiet/MeetingOpinionSection";
import { MeetingFooterActions } from "../components/chi-tiet/MeetingFooterActions";
import { useMeetingState } from "../hooks/useMeetingState";
import { AddOpinionForContentModal } from "../components/AddOpinionForContentModal";
import { ViewOpinionModal } from "../components/ViewOpinionModal";
import { mapMeetingStatusVi } from "../utils/meetingHelpers";
import { getRemainingTimeVi } from "@/common/utils/timeHelpers";
import { LoadingOverlay } from "@/common/components/ui/LoadingOverlay";
import { getErrorMessage } from "@/lib/api/error";

export default function PhienHopChiTietPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const searchParams = new URLSearchParams(location.search);
    const guestToken = searchParams.get('guestToken');
    const isGuest = !!guestToken;

    // Consolidated meeting state and automatic WebSocket synchronization
    const {
        meeting: meetingDetail,
        agendaItems,
        opinions,
        motions,
        speakersQueue,
        attendees: rawAttendees,
        refreshAll: loadData,
        refreshMeetingOnly,
        loading,
        error,
    } = useMeetingState(id, guestToken);

    const errorCode = error?.response?.data?.code;

    useEffect(() => {
        if (errorCode === 1003) {
            toast.error("Phiên họp đã được chuyển về Bản nháp hoặc bạn không có quyền truy cập.");
            navigate(isGuest ? "/" : "/phien-hop");
        }
    }, [errorCode, navigate, isGuest]);

    // Tab and modal states
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedMotionForStats, setSelectedMotionForStats] = useState<any | null>(null);
    const [voteStats, setVoteStats] = useState<any | null>(null);
    const [isVoteStatsOpen, setIsVoteStatsOpen] = useState(false);

    const [timeLeftStr, setTimeLeftStr] = useState<string>("");
    const [opinionDetail, setOpinionDetail] = useState("");
    const [selectedAgendaItemId, setSelectedAgendaItemId] = useState("");
    const [isOpinionModalOpen, setIsOpinionModalOpen] = useState(false);
    const [selectedViewOpinion, setSelectedViewOpinion] = useState<any | null>(null);
    const [isViewOpinionModalOpen, setIsViewOpinionModalOpen] = useState(false);

    const availableDocuments = useMemo(() => {
        const list = agendaItems.flatMap((item: any) => 
            (item.documents || []).map((doc: any) => ({
                value: doc.documentId || doc.id,
                label: doc.title || doc.fileName || ""
            }))
        );
        if (meetingDetail?.agendaFile) {
            list.unshift({
                value: meetingDetail.agendaFile.id,
                label: meetingDetail.agendaFile.name || "Chương trình họp"
            });
        }
        return list;
    }, [agendaItems, meetingDetail]);

    const availableContents = useMemo(() => {
        return agendaItems.map((item: any) => ({
            value: item.id.toString(),
            label: item.title
        }));
    }, [agendaItems]);

    const mappedOpinions = useMemo(() => {
        return opinions.map((op: any) => {
            const documentName = op.documentName || undefined;
            const attachments = (op.attachments || [])
                .map((att: any) => ({
                    name: att.fileName || att.title || "",
                    size: att.fileSize || 0,
                    documentId: att.documentId,
                    fileUrl: att.fileUrl
                }))
                .filter((att: any) => att.name !== documentName);

            return {
                id: op.id,
                userName: op.delegateName || op.userName || "",
                userPosition: op.position || "-",
                documentName,
                opinionDetail: op.content || "",
                attachments,
                createdAt: op.time ? new Date(op.time).toLocaleString("vi-VN") : ""
            };
        });
    }, [opinions]);
    const [isManageParticipantsOpen, setIsManageParticipantsOpen] = useState(false);
    const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
    const [speakingDuration, setSpeakingDuration] = useState("5");
    const [durationTargetQueueId, setDurationTargetQueueId] = useState<string | number | null>(null);
    const [participantsData, setParticipantsData] = useState<ThanhPhanThamDuData>({
        donVi: [],
        caNhan: [],
        nhomThanhVien: [],
        khachMoi: [],
        chuTriId: null,
    });

    const status = useMemo(() => {
        return meetingDetail ? mapMeetingStatusVi(meetingDetail.status) : "";
    }, [meetingDetail]);

    // Computed speaker lists based on queueStatus
    const waitingSpeakers = useMemo(() => {
        return speakersQueue.filter((s: any) => s.queueStatus === "QUEUED");
    }, [speakersQueue]);

    const rejectedSpeakers = useMemo(() => {
        return speakersQueue.filter((s: any) => s.queueStatus === "REJECTED");
    }, [speakersQueue]);

    const spokenSpeakers = useMemo(() => {
        return speakersQueue.filter((s: any) => s.queueStatus === "SPEAKING" || s.queueStatus === "DONE");
    }, [speakersQueue]);

    // Track active speaker states for current user
    const isCurrentUserQueued = useMemo(() => {
        return waitingSpeakers.some((s: any) => s.userId === user?.id);
    }, [waitingSpeakers, user]);

    const currentUserQueueItem = useMemo(() => {
        return waitingSpeakers.find((s: any) => s.userId === user?.id);
    }, [waitingSpeakers, user]);

    const isAttendee = useMemo(() => {
        if (!meetingDetail) return false;
        return (
            meetingDetail.callerRole === 'CREATOR' ||
            meetingDetail.callerRole === 'SECRETARY' ||
            meetingDetail.callerRole === 'CHAIR' ||
            meetingDetail.callerRole === 'CHAIRPERSON' ||
            (!!meetingDetail.callerInviteStatus && meetingDetail.callerInviteStatus !== 'DECLINED')
        );
    }, [meetingDetail]);

    // Auto calculate time remaining for active meetings
    useEffect(() => {
        if (
            !meetingDetail ||
            meetingDetail.status !== "IN_PROGRESS" ||
            !meetingDetail.endTime
        ) {
            setTimeLeftStr("");
            return;
        }

        const calculateTimeLeft = () => {
            setTimeLeftStr(getRemainingTimeVi(meetingDetail.endTime));
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [meetingDetail]);

    if (errorCode === 1251) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center transition-all duration-300 hover:shadow-2xl">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
                        <CalendarClock className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Phiên họp chưa bắt đầu</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Thời gian diễn ra phiên họp chưa đến. Vui lòng kiểm tra lại thời gian bắt đầu trong thư mời và truy cập lại sau.
                    </p>
                    <div className="bg-amber-50/50 rounded-2xl p-4 mb-8 border border-amber-100/50 text-left">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 block mb-1">Lưu ý cho khách mời</span>
                        <span className="text-xs text-amber-700 leading-relaxed">
                            Liên kết truy cập phòng họp chỉ khả dụng từ thời điểm bắt đầu cuộc họp. Vui lòng không truy cập sớm trước giờ quy định.
                        </span>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full bg-[#C8102E] hover:bg-[#a80d26] rounded-full py-6 text-base font-semibold shadow-lg shadow-red-500/20 transition-all duration-200"
                        onClick={() => loadData()}
                    >
                        Tải lại trang
                    </Button>
                </div>
            </div>
        );
    }

    if (errorCode === 1252) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center transition-all duration-300 hover:shadow-2xl">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                        <CalendarX className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Phiên họp đã kết thúc</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Phiên họp này đã hoàn thành hoặc đã bị hủy bỏ bởi Ban tổ chức. Liên kết truy cập của bạn đã hết hạn khả dụng.
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100 text-left">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">Trạng thái liên kết</span>
                        <span className="text-xs text-gray-500 leading-relaxed">
                            Quyền truy cập phòng họp dành cho khách mời tự động đóng lại sau khi phiên họp kết thúc để đảm bảo an toàn thông tin.
                        </span>
                    </div>
                    {isGuest ? (
                        <div className="text-center text-sm text-gray-500 font-medium py-3">
                            Cảm ơn quý khách đã tham dự phiên họp.
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full rounded-full py-6 text-base font-semibold border-gray-200 text-gray-750 hover:bg-gray-50"
                            onClick={() => navigate('/')}
                        >
                            Quay lại Trang chủ
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Action Handlers
    const handleConfirmEnd = async () => {
        if (!id) return;
        try {
            const res = await meetingApi.closeMeeting(id);
            if (res.success) {
                toast.success("Đã kết thúc phiên họp thành công");
                refreshMeetingOnly();
            } else {
                toast.error(res.message || "Không thể kết thúc phiên họp");
            }
        } catch (error) {
            console.error("Error closing meeting:", error);
            toast.error("Đã xảy ra lỗi khi kết thúc phiên họp");
        }
        setIsConfirmOpen(false);
    };

    const handleConfirmCancel = async () => {
        if (!id) return;
        try {
            const res = await meetingApi.cancelMeeting(id, "Hủy phiên họp theo yêu cầu");
            if (res.success) {
                toast.success("Đã hủy phiên họp thành công");
                refreshMeetingOnly();
            } else {
                toast.error(res.message || "Không thể hủy phiên họp");
            }
        } catch (error) {
            console.error("Error cancelling meeting:", error);
            toast.error("Đã xảy ra lỗi khi hủy phiên họp");
        }
        setIsCancelConfirmOpen(false);
    };

    const handleConfirmRevert = async () => {
        if (!id) return;
        try {
            const revertRes = await meetingApi.revertToDraft(id);
            if (revertRes.success) {
                toast.success("Đã chuyển phiên họp về trạng thái Bản nháp");
                navigate(`/phien-hop/${id}/cap-nhat`);
            } else {
                toast.error(revertRes.message || "Không thể chuyển trạng thái phiên họp.");
            }
        } catch (revertErr: any) {
            toast.error(revertErr?.response?.data?.message || revertErr?.message || "Đã xảy ra lỗi.");
        }
        setIsRevertConfirmOpen(false);
    };
    const handleConfirmAttendance = async (
        attendance: "attend" | "absent",
        data?: {
            isFullSession: boolean;
            reason: string;
            contentIds: string[];
            substituteId?: string;
            subName?: string;
            subPosition?: string;
            subAgency?: string;
            subEmail?: string;
            subPhone?: string;
        },
    ) => {
        if (!id || !user?.id) {
            toast.error("Không tìm thấy thông tin phiên họp hoặc người dùng.");
            return;
        }
        try {
            const statusStr = attendance === "attend" ? "ACCEPTED" : "DECLINED";
            const payload: any = {
                inviteStatus: statusStr,
            };

            if (attendance === "absent" && data) {
                payload.declineReason = data.reason;
                payload.isFullSession = data.isFullSession;
                if (!data.isFullSession) {
                    payload.absentAgendaItemIds = data.contentIds;
                }
                if (data.substituteId && data.substituteId !== "other") {
                    payload.substituteUserId = data.substituteId;
                } else if (data.substituteId === "other") {
                    payload.substituteUserId = null;
                    payload.substituteName = data.subName;
                    payload.substitutePosition = data.subPosition;
                    payload.substituteCompany = data.subAgency;
                    payload.substituteDepartment = data.subAgency;
                    payload.substituteEmail = data.subEmail;
                    payload.substitutePhone = data.subPhone;
                }
            }
            const res = await meetingApi.updateInviteStatus(
                id,
                user.id,
                payload
            );
            if (res.success) {
                toast.success(
                    attendance === "attend"
                        ? "Đã xác nhận tham gia phiên họp thành công"
                        : "Đã từ chối tham gia phiên họp thành công",
                );
                loadData();
            } else {
                toast.error(res.message || "Không thể gửi phản hồi tham dự");
            }
        } catch (error) {
            console.error("Error confirming attendance:", error);
            toast.error(getErrorMessage(error, "Đã xảy ra lỗi khi gửi phản hồi tham dự"));
        }
        setIsAttendanceModalOpen(false);
    };

    const handleDeleteMeeting = async () => {
        if (!id) return;
        try {
            const res = await meetingApi.deleteMeeting(id);
            if (res.success) {
                toast.success("Đã xóa phiên họp thành công");
                navigate("/phien-hop");
            } else {
                toast.error(res.message || "Không thể xóa phiên họp");
            }
        } catch (error) {
            console.error("Error deleting meeting:", error);
            toast.error("Đã xảy ra lỗi khi xóa phiên họp");
        }
    };

    const handleAddOpinionForContent = async (data: any) => {
        if (!id) return;
        try {
            let documentIds: string[] = [];
            if (data.attachments && data.attachments.length > 0) {
                const uploadPromises = data.attachments.map((file: any) => meetingApi.uploadDocument(file));
                const uploadResponses = await Promise.all(uploadPromises);
                documentIds = uploadResponses
                    .filter(res => res.success && res.data)
                    .map(res => res.data!.id);
            }

            const documentName = data.documentId
                ? availableDocuments.find((doc) => doc.value === data.documentId)?.label
                : undefined;

            const res = await meetingApi.createOpinion(id, {
                opinionDetail: data.opinionDetail,
                documentName,
                documentIds: documentIds.length > 0 ? documentIds : undefined
            });

            if (res.success) {
                toast.success("Đã gửi ý kiến góp ý thành công");
                setIsOpinionModalOpen(false);
                loadData();
            } else {
                toast.error(res.message || "Không thể gửi ý kiến góp ý");
            }
        } catch (error) {
            console.error("Error creating opinion:", error);
            toast.error("Đã xảy ra lỗi khi gửi ý kiến góp ý");
        }
    };

    const handleViewOpinion = (opinion: any) => {
        setSelectedViewOpinion(opinion);
        setIsViewOpinionModalOpen(true);
    };

    const handleSubmitApproval = async () => {
        if (!id) return;
        if (meetingDetail?.startTime) {
            const startTime = new Date(meetingDetail.startTime);
            const now = new Date();
            const minAllowedTime = new Date(now.getTime() + 30 * 60 * 1000); // Now + 30 mins
            if (startTime < minAllowedTime) {
                toast.error("Thời gian bắt đầu phiên họp phải lớn hơn thời gian hiện tại ít nhất 30 phút.");
                return;
            }
        }
        try {
            const res = await meetingApi.submitApproval(id);
            if (res.success) {
                toast.success("Đã trình duyệt phiên họp thành công");
                refreshMeetingOnly();
            } else {
                toast.error(res.message || "Không thể trình duyệt phiên họp");
            }
        } catch (error) {
            console.error("Error submitting approval:", error);
            toast.error("Đã xảy ra lỗi khi trình duyệt phiên họp");
        }
    };

    const handleApproveMeeting = async () => {
        if (!id) return;
        try {
            const res = await meetingApi.approveMeeting(id);
            if (res.success) {
                toast.success("Đã phê duyệt phiên họp thành công");
                refreshMeetingOnly();
            } else {
                toast.error(res.message || "Không thể phê duyệt phiên họp");
            }
        } catch (error) {
            console.error("Error approving meeting:", error);
            toast.error("Đã xảy ra lỗi khi phê duyệt phiên họp");
        }
    };

    const handleConfirmReject = async () => {
        if (!id) return;
        if (!rejectReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        try {
            const res = await meetingApi.rejectMeeting(id, rejectReason);
            if (res.success) {
                toast.success("Đã từ chối phiên họp thành công");
                setIsRejectOpen(false);
                setRejectReason("");
                refreshMeetingOnly();
            } else {
                toast.error(res.message || "Không thể từ chối phiên họp");
            }
        } catch (error) {
            console.error("Error rejecting meeting:", error);
            toast.error("Đã xảy ra lỗi khi từ chối phiên họp");
        }
    };

    const handlePublishMeeting = async () => {
        if (!id) return;
        if (meetingDetail?.startTime) {
            const startTime = new Date(meetingDetail.startTime);
            const now = new Date();
            const minAllowedTime = new Date(now.getTime() + 30 * 60 * 1000);
            if (startTime < minAllowedTime) {
                setIsRevertConfirmOpen(true);
                return;
            }
        }

        try {
            const res = await meetingApi.publishMeeting(id);
            if (res.success) {
                toast.success("Đã công bố phiên họp thành công");
                refreshMeetingOnly();
            } else {
                toast.error(res.message || "Không thể công bố phiên họp");
            }
        } catch (error: any) {
            console.error("Error publishing meeting:", error);
            const isTimeError = error && error.response && error.response.data && error.response.data.code === 1222;
            if (isTimeError) {
                setIsRevertConfirmOpen(true);
            } else {
                toast.error("Đã xảy ra lỗi khi công bố phiên họp");
            }
        }
    };

    const handleRequestToSpeak = async () => {
        if (!id) return;
        try {
            const res = await meetingApi.requestToSpeak(id);
            if (res.success) {
                toast.success("Đã đăng ký phát biểu thành công");
                loadData();
            } else {
                toast.error(res.message || "Không thể đăng ký phát biểu");
            }
        } catch (error) {
            console.error("Error requesting to speak:", error);
            toast.error("Đã xảy ra lỗi khi đăng ký phát biểu");
        }
    };

    const handleCancelSpeakRequest = async () => {
        if (!id || !currentUserQueueItem) return;
        try {
            const res = await meetingApi.cancelSpeakRequest(id, currentUserQueueItem.id);
            if (res.success) {
                toast.success("Đã hủy đăng ký phát biểu thành công");
                loadData();
            } else {
                toast.error(res.message || "Không thể hủy đăng ký phát biểu");
            }
        } catch (error) {
            console.error("Error cancelling speak request:", error);
            toast.error("Đã xảy ra lỗi khi hủy đăng ký phát biểu");
        }
    };

    const handleStartSpeakerTurn = async (queueId: string | number) => {
        if (!id) return;
        setDurationTargetQueueId(queueId);
        setSpeakingDuration("5");
        setIsDurationModalOpen(true);
    };

    const handleConfirmDuration = async () => {
        if (!id || !durationTargetQueueId) return;
        const minutes = parseInt(speakingDuration, 10);
        if (isNaN(minutes) || minutes <= 0) {
            toast.error("Thời gian phát biểu không hợp lệ (phải là số nguyên lớn hơn 0)");
            return;
        }
        try {
            const res = await meetingApi.startSpeakerTurn(id, durationTargetQueueId.toString(), minutes);
            if (res.success) {
                toast.success("Đã bắt đầu lượt phát biểu");
                loadData();
                setIsDurationModalOpen(false);
                setDurationTargetQueueId(null);
            } else {
                toast.error(res.message || "Không thể cho phát biểu");
            }
        } catch (error) {
            console.error("Error starting speaker turn:", error);
            toast.error("Đã xảy ra lỗi khi cho đại biểu phát biểu");
        }
    };

    const handleRejectSpeakRequest = async (queueId: string | number) => {
        if (!id) return;
        try {
            const res = await meetingApi.rejectSpeakRequest(id, queueId.toString());
            if (res.success) {
                toast.success("Đã bác bỏ yêu cầu phát biểu");
                loadData();
            } else {
                toast.error(res.message || "Không thể bác bỏ yêu cầu");
            }
        } catch (error) {
            console.error("Error rejecting speak request:", error);
            toast.error("Đã xảy ra lỗi khi bác bỏ yêu cầu");
        }
    };

    const handleViewVoteStats = async (motion: any) => {
        try {
            const res = await meetingApi.getVoteStatistics(motion.id);
            if (res.success && res.data) {
                const stats = res.data;
                const total = stats.yesCount + stats.noCount + (stats.otherCount || 0);
                const yesPercentage = total > 0 ? Math.round((stats.yesCount / total) * 100) : 0;
                setVoteStats({
                    ...stats,
                    yesVotes: stats.yesCount,
                    noVotes: stats.noCount,
                    otherVotes: stats.otherCount || 0,
                    yesPercentage: yesPercentage
                });
                setSelectedMotionForStats(motion);
                setIsVoteStatsOpen(true);
            } else {
                toast.error("Không thể lấy thống kê biểu quyết.");
            }
        } catch (error) {
            console.error("Error fetching vote stats:", error);
            toast.error("Đã xảy ra lỗi khi lấy thống kê biểu quyết");
        }
    };

    const handleOpenParticipants = async () => {
        if (!id) return;
        setIsParticipantsLoading(true);
        try {
            const res = await meetingApi.getAttendees(id);
            if (res.success && res.data) {
                const parts = res.data.participants || [];
                const guests = res.data.guests || [];

                const donViMapped = parts.map((p: any) => ({
                    id: p.userId,
                    name: p.fullName || p.username || "Không xác định",
                    position: p.positionName || "-",
                    unit: p.deptName || "-",
                    email: p.email || "-",
                    isChair: p.participantRole === "CHAIR" || p.participantRole === "CHAIRPERSON",
                    isSecretary: p.participantRole === "SECRETARY",
                    sendStatus: p.sendStatus || "PENDING",
                    substitutedForUserName: p.substitutedForUserName,
                    substitutedForUserPosition: p.substitutedForUserPosition,
                }));

                const khachMoiMapped = guests.map((g: any) => ({
                    id: g.guestId || g.id,
                    name: g.fullName || "Khách mời",
                    position: g.position || "-",
                    unit: g.company || "-",
                    email: g.email || "-",
                    phone: g.phone || "-",
                    sendStatus: g.sendStatus || "PENDING",
                    substitutedForUserName: g.substitutedForUserName,
                    substitutedForUserPosition: g.substitutedForUserPosition,
                }));

                const chair = parts.find(
                    (p: any) => p.participantRole === "CHAIR" || p.participantRole === "CHAIRPERSON",
                );

                setParticipantsData({
                    donVi: donViMapped,
                    caNhan: [],
                    nhomThanhVien: [],
                    khachMoi: khachMoiMapped,
                    chuTriId: chair ? chair.userId : null,
                });
                setIsManageParticipantsOpen(true);
            } else {
                toast.error(res.message || "Không thể tải danh sách thành phần tham gia");
            }
        } catch (error) {
            console.error("Error fetching attendees:", error);
            toast.error("Đã xảy ra lỗi khi tải danh sách thành phần tham gia");
        } finally {
            setIsParticipantsLoading(false);
        }
    };

    return (
        <>
            {loading && <LoadingOverlay message="Đang tải chi tiết phiên họp..." />}
            {isParticipantsLoading && <LoadingOverlay message="Đang tải danh sách thành phần tham gia..." />}
            <ManageParticipantsModal
                isOpen={isManageParticipantsOpen}
                onClose={() => setIsManageParticipantsOpen(false)}
                initialData={participantsData}
                readOnly={true}
                creatorId={meetingDetail?.createdById}
            />
            <div className="p-8">
                <PageHeader
                    title={
                        isGuest ? (
                            <span className="text-lg font-semibold text-gray-900">Chi tiết phiên họp</span>
                        ) : (
                            <button
                                onClick={() => navigate("/phien-hop")}
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-sm body">Quay lại</span>
                            </button>
                        )
                    }
                    breadcrumbs={isGuest ? [] : [
                        { name: "Trang chủ", path: "/" },
                        { name: "Phiên họp", path: "/phien-hop" },
                        { name: "Chi tiết phiên họp" },
                    ]}
                    actions={
                        isGuest ? (
                            <div className="flex items-center gap-3">
                                {meetingDetail?.status !== "DRAFT" &&
                                    meetingDetail?.status !== "CLOSED" &&
                                    meetingDetail?.status !== "CANCELLED" &&
                                    meetingDetail?.status !== "REJECTED" &&
                                    meetingDetail?.status !== "PENDING_APPROVAL" && (
                                        <Button
                                            variant="primary"
                                            className="bg-[#C8102E] hover:bg-[#a80d26]"
                                            onClick={() => navigate(`/phien-hop/${id}/dien-bien?guestToken=${guestToken}`)}
                                        >
                                            Xem diễn biến
                                        </Button>
                                    )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                {meetingDetail?.callerInviteStatus === "PENDING" &&
                                    meetingDetail?.status === "UPCOMING" && (
                                        <Button
                                            variant="primary"
                                            className="bg-[#C8102E] hover:bg-[#a80d26]"
                                            onClick={() => setIsAttendanceModalOpen(true)}
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Xác nhận tham gia
                                        </Button>
                                    )}
                                {(meetingDetail?.canEdit || 
                                  (["APPROVED", "PENDING_APPROVAL", "UPCOMING", "IN_PROGRESS", "CLOSED"].includes(meetingDetail?.status) && 
                                   (meetingDetail?.callerRole === "CREATOR" || 
                                    meetingDetail?.callerRole === "SECRETARY"))) && (
                                    <Button
                                        variant="outline"
                                        className="border-[#C8102E] text-[#C8102E] hover:bg-red-50"
                                        onClick={() => navigate(`/phien-hop/${id}/cap-nhat`)}
                                    >
                                        Cập nhật
                                    </Button>
                                )}
                                {meetingDetail?.status !== "DRAFT" &&
                                    meetingDetail?.status !== "CLOSED" &&
                                    meetingDetail?.status !== "CANCELLED" &&
                                    meetingDetail?.status !== "REJECTED" &&
                                    meetingDetail?.status !== "PENDING_APPROVAL" &&
                                    meetingDetail?.callerInviteStatus !== "PENDING" &&
                                    isAttendee && (
                                        <Button
                                            variant="primary"
                                            className="bg-[#C8102E] hover:bg-[#a80d26]"
                                            onClick={() => navigate(`/phien-hop/${id}/dien-bien`)}
                                        >
                                            Xem diễn biến
                                        </Button>
                                    )}
                            </div>
                        )
                    }
                />

                <div className="space-y-6">
                    {/* 1. Meeting Overview Info Section */}
                    <MeetingInfoSection
                        meetingDetail={meetingDetail}
                        status={status}
                        timeLeftStr={timeLeftStr}
                        handleOpenParticipants={handleOpenParticipants}
                        isGuest={isGuest}
                    />

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* 2. Documents Section grouped by Agenda Items */}
                        <MeetingDocumentSection
                            agendaItems={agendaItems}
                            viewDocument={(docId) => viewDocument(docId, guestToken)}
                            downloadDocument={(docId, title) => downloadDocument(docId, title, guestToken)}
                            agendaFile={meetingDetail?.agendaFile}
                        />

                        {/* 3. Voting Items Section */}
                        {!isGuest && (
                            <MeetingMotionSection
                                motions={motions}
                                agendaItems={agendaItems}
                                handleViewVoteStats={handleViewVoteStats}
                            />
                        )}

                        {/* 4. Speaker Queue Registration List Section */}
                        {!isGuest && (
                            <MeetingSpeakerRegistrationSection
                                spokenSpeakers={spokenSpeakers}
                                rejectedSpeakers={rejectedSpeakers}
                                meetingDetail={meetingDetail}
                                handleStartSpeakerTurn={handleStartSpeakerTurn}
                                handleRejectSpeakRequest={handleRejectSpeakRequest}
                            />
                        )}

                        {/* 5. Opinions Feedback Section */}
                        {!isGuest && (
                            <MeetingOpinionSection
                                opinions={mappedOpinions}
                                onAddOpinion={() => setIsOpinionModalOpen(true)}
                                onViewOpinion={handleViewOpinion}
                                disabled={meetingDetail?.status === "CLOSED" || meetingDetail?.status === "CANCELLED"}
                            />
                        )}

                        {/* 6. Footer Actions Panel */}
                        {!isGuest && (
                            <MeetingFooterActions
                                meetingDetail={meetingDetail}
                                handleDeleteMeeting={handleDeleteMeeting}
                                handleSubmitApproval={handleSubmitApproval}
                                handleApproveMeeting={handleApproveMeeting}
                                setIsRejectOpen={setIsRejectOpen}
                                setIsCancelConfirmOpen={setIsCancelConfirmOpen}
                                handlePublishMeeting={handlePublishMeeting}
                                setIsConfirmOpen={setIsConfirmOpen}
                            />
                        )}
                    </div>
                </div>
            </div>

            <ConfirmActionModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmEnd}
                actionType="end"
            />

            <ConfirmActionModal
                isOpen={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                onConfirm={handleConfirmCancel}
                actionType="cancel"
                meetingTitle={meetingDetail?.title}
            />

            <ConfirmActionModal
                isOpen={isRevertConfirmOpen}
                onClose={() => setIsRevertConfirmOpen(false)}
                onConfirm={handleConfirmRevert}
                actionType="revertToDraft"
                meetingTitle={meetingDetail?.title}
            />
            <ConfirmAttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                onConfirm={handleConfirmAttendance}
                meetingId={id}
            />
            {/* Vote Statistics Modal */}
            <Dialog open={isVoteStatsOpen} onOpenChange={setIsVoteStatsOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Kết quả biểu quyết
                        </DialogTitle>
                    </DialogHeader>
                    {selectedMotionForStats && voteStats && (
                        <div className="space-y-6 mt-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="text-sm font-semibold text-gray-800">
                                    Vấn đề biểu quyết
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectedMotionForStats.title || selectedMotionForStats.content}
                                </p>
                            </div>
                             <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 border border-green-100 bg-green-50/30 rounded-xl text-center">
                                    <span className="text-xs text-green-700 font-medium">
                                        Đồng ý
                                    </span>
                                    <p className="text-xl font-bold text-green-600 mt-1">
                                        {voteStats.yesVotes}
                                    </p>
                                </div>
                                <div className="p-3 border border-red-100 bg-red-50/10 rounded-xl text-center">
                                    <span className="text-xs text-red-700 font-medium">
                                        Không đồng ý
                                    </span>
                                    <p className="text-xl font-bold text-red-600 mt-1">
                                        {voteStats.noVotes}
                                    </p>
                                </div>
                                <div className="p-3 border border-amber-100 bg-amber-50/20 rounded-xl text-center">
                                    <span className="text-xs text-amber-700 font-medium">
                                        Ý kiến khác
                                    </span>
                                    <p className="text-xl font-bold text-amber-600 mt-1">
                                        {voteStats.otherVotes || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tỉ lệ đồng ý</span>
                                    <span className="font-semibold">
                                        {voteStats.yesPercentage}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-green-500 h-full transition-all"
                                        style={{
                                            width: `${voteStats.yesPercentage}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() => setIsVoteStatsOpen(false)}
                                >
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Meeting Modal */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Từ chối duyệt phiên họp
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Lý do từ chối <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="w-full min-h-[100px] p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] text-sm"
                                placeholder="Nhập lý do từ chối phê duyệt..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                    setIsRejectOpen(false);
                                    setRejectReason("");
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="primary"
                                className="bg-[#C8102E] hover:bg-[#a80d26] rounded-full text-white"
                                onClick={handleConfirmReject}
                            >
                                Xác nhận từ chối
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Opinion Modal */}
            <AddOpinionForContentModal
                isOpen={isOpinionModalOpen}
                onClose={() => setIsOpinionModalOpen(false)}
                onAdd={handleAddOpinionForContent}
                contents={availableContents}
                documents={availableDocuments}
            />

            {/* View Opinion Modal */}
            <ViewOpinionModal
                isOpen={isViewOpinionModalOpen}
                onClose={() => {
                    setIsViewOpinionModalOpen(false);
                    setSelectedViewOpinion(null);
                }}
                opinion={selectedViewOpinion}
                guestToken={guestToken}
            />

            {/* Speaking Duration Modal */}
            <Dialog open={isDurationModalOpen} onOpenChange={setIsDurationModalOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Thiết lập thời gian phát biểu
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Thời gian phát biểu (phút) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] text-sm"
                                placeholder="Nhập số phút phát biểu..."
                                value={speakingDuration}
                                onChange={(e) => setSpeakingDuration(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                    setIsDurationModalOpen(false);
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="primary"
                                className="bg-[#C8102E] hover:bg-[#a80d26] rounded-full text-white"
                                onClick={handleConfirmDuration}
                            >
                                Xác nhận
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
