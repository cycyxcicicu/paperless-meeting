import { useAuth } from '@/app/context/AuthContext';
import { toast } from "@/lib/toast";
import { OpinionForContentData } from '@/modules/meeting/components/AddOpinionForContentModal';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import {
    Delegate,
    MeetingContent,
    NotVotedDelegate,
    Opinion,
    Participant,
    Speaker,
    VotedDelegate,
    VotingIssue,
    VotingResult
} from '../meeting.mock';
import { meetingApi } from "../services/meeting.api";
import { mapVotingResults } from '../utils/meetingHelpers';
import { useMeetingState } from './useMeetingState';

export function useDienBienPhienHop(guestToken?: string | null) {
    const { id } = useParams<{ id: string }>();

    // Call shared hook for meeting state loading & WS synchronization
    const {
        meeting,
        agendaItems: rawAgendaItems,
        opinions: rawOpinions,
        motions: rawMotions,
        speakersQueue: rawSpeakersQueue,
        attendees: rawAttendees,
        refreshAll: refreshData,
        refreshAgendaOnly,
        loading,
        error
    } = useMeetingState(id, guestToken);

    const { user } = useAuth();
    const isGuest = !!guestToken;

    const currentUserParticipant = useMemo(() => {
        if (isGuest) {
            if (!guestToken || !rawAttendees.guests) return null;
            return rawAttendees.guests.find((g: any) => String(g.guestToken) === String(guestToken));
        } else {
            if (!user?.id || !rawAttendees.participants) return null;
            return rawAttendees.participants.find((p: any) => String(p.userId) === String(user.id));
        }
    }, [isGuest, guestToken, user, rawAttendees.participants, rawAttendees.guests]);

    const isSelfCheckedIn = useMemo(() => {
        if (!currentUserParticipant) return false;
        return currentUserParticipant.attendanceStatus === "PRESENT";
    }, [currentUserParticipant]);

    const isWithinCheckInWindow = useMemo(() => {
        if (!meeting?.startTime) return false;
        const startTime = new Date(meeting.startTime).getTime();
        const now = new Date().getTime();
        const thirtyMinsBefore = startTime - 30 * 60 * 1000;
        return now >= thirtyMinsBefore;
    }, [meeting]);

    const checkAttendance = useCallback(() => {
        if (!isSelfCheckedIn) {
            toast.warning("Bạn chưa điểm danh tham dự cuộc họp này. Vui lòng bấm nút 'Điểm danh ngay' trên banner cảnh báo trước!");
            return false;
        }
        return true;
    }, [isSelfCheckedIn]);

    const handleSelfCheckIn = useCallback(async () => {
        if (!meeting?.id) return;
        try {
            if (isGuest) {
                if (!guestToken) return;
                const res = await meetingApi.publicUpdateAttendanceStatus(guestToken, {
                    attendanceStatus: "PRESENT"
                });
                if (res.success) {
                    toast.success("Điểm danh thành công!");
                    refreshData();
                } else {
                    toast.error(res.message || "Điểm danh thất bại");
                }
            } else {
                if (!currentUserParticipant?.id) {
                    toast.error("Không tìm thấy thông tin đại biểu của bạn để điểm danh.");
                    return;
                }
                const res = await meetingApi.updateAttendanceStatus(meeting.id, currentUserParticipant.id, "INTERNAL", "PRESENT");
                if (res.success) {
                    toast.success("Điểm danh thành công!");
                    refreshData();
                } else {
                    toast.error(res.message || "Điểm danh thất bại");
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Lỗi khi thực hiện điểm danh");
        }
    }, [meeting, isGuest, guestToken, currentUserParticipant, refreshData]);

    const [activeTurnId, setActiveTurnId] = useState<string | null>(null);

    // UI-only states
    const [activeContent, setActiveContent] = useState<string | number>("");
    const [activeTab, setActiveTab] = useState<"cho" | "bac-bo">("cho");
    const [isAddSpeakerModalOpen, setIsAddSpeakerModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isStartContentModalOpen, setIsStartContentModalOpen] = useState(false);
    const [isApproveContentModalOpen, setIsApproveContentModalOpen] = useState(false);
    const [isAddOpinionForContentModalOpen, setIsAddOpinionForContentModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState<MeetingContent | null>(null);
    const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
    const [durationModalType, setDurationModalType] = useState<'assign' | 'add' | null>(null);
    const [durationTargetId, setDurationTargetId] = useState<string | number | null>(null);
    const [durationSelectedParticipants, setDurationSelectedParticipants] = useState<Participant[]>([]);
    const [speakingDuration, setSpeakingDuration] = useState("5");
    const [selectedViewOpinion, setSelectedViewOpinion] = useState<Opinion | null>(null);
    const [isViewOpinionModalOpen, setIsViewOpinionModalOpen] = useState(false);

    const isAbsentOnActiveContent = useMemo(() => {
        if (!currentUserParticipant || !activeContent) return false;
        const agendaId = activeContent.toString();

        // Guest check
        if (isGuest) {
            const delegatorId = currentUserParticipant.substituteForParticipantId;
            if (!delegatorId) return true; // Block if not a substitute
            const delegator = (rawAttendees.participants || []).find((p: any) => p.id === delegatorId);
            if (!delegator) return true;
            const isDelegatorAbsent = delegator.inviteStatus === "DECLINED" && (delegator.isFullSession || 
                (delegator.absentAgendaItemIds && delegator.absentAgendaItemIds.includes(agendaId)));
            return !isDelegatorAbsent; // Guest can speak only if delegator is absent
        }

        // Internal user substitute check
        if (currentUserParticipant.isSubstitute) {
            const delegatorId = currentUserParticipant.substituteForParticipantId;
            if (!delegatorId) return true; // Block if delegator not set
            const delegator = (rawAttendees.participants || []).find((p: any) => p.id === delegatorId);
            if (!delegator) return true;
            const isDelegatorAbsent = delegator.inviteStatus === "DECLINED" && (delegator.isFullSession || 
                (delegator.absentAgendaItemIds && delegator.absentAgendaItemIds.includes(agendaId)));
            return !isDelegatorAbsent; // Substitute can speak only if delegator is absent
        }

        // Regular delegate check
        return currentUserParticipant.inviteStatus === "DECLINED" && (currentUserParticipant.isFullSession || 
            (currentUserParticipant.absentAgendaItemIds && currentUserParticipant.absentAgendaItemIds.includes(agendaId)));
    }, [currentUserParticipant, activeContent, isGuest, rawAttendees.participants]);

    // Voting modal states
    const [currentVotingIssue, setCurrentVotingIssue] = useState<VotingIssue | null>(null);
    const [isConfirmBroadcastModalOpen, setIsConfirmBroadcastModalOpen] = useState(false);
    const [isReadinessCheckModalOpen, setIsReadinessCheckModalOpen] = useState(false);
    const [isVotingTimeModalOpen, setIsVotingTimeModalOpen] = useState(false);
    const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
    const [isPauseVotingModalOpen, setIsPauseVotingModalOpen] = useState(false);
    const [isVotingResultModalOpen, setIsVotingResultModalOpen] = useState(false);
    const [votingResultData, setVotingResultData] = useState<{
        results: VotingResult;
        votedDelegates: VotedDelegate[];
        notVotedDelegates: NotVotedDelegate[];
        showVotingList: boolean;
    } | null>(null);

    // Initialize activeContent to the first item, or the one currently IN_PROGRESS
    useEffect(() => {
        if (!activeContent) {
            const inProgressItem = rawAgendaItems.find(item => item.status === "IN_PROGRESS");
            if (inProgressItem) {
                setActiveContent(inProgressItem.id);
            } else if (meeting?.agendaFile) {
                setActiveContent("GENERAL_AGENDA");
            } else if (rawAgendaItems.length > 0) {
                setActiveContent(rawAgendaItems[0].id);
            }
        }
    }, [rawAgendaItems, activeContent, meeting]);

    // Derived states
    const meetingContents = useMemo<MeetingContent[]>(() => {
        const list: MeetingContent[] = [];
        if (meeting?.agendaFile) {
            list.push({
                id: "GENERAL_AGENDA",
                title: "Chương trình họp chung",
                description: "Tài liệu chương trình họp tổng quan của phiên họp.",
                status: "DONE",
                durationEst: 0,
                preparedByFullName: "",
                documents: []
            });
        }
        rawAgendaItems.forEach(item => {
            list.push({
                id: item.id,
                title: item.title,
                description: item.content || "",
                status: item.status,
                durationEst: item.durationEst,
                preparedByFullName: item.preparedByFullName,
                startTime: item.startTime,
                endTime: item.endTime,
                documents: (item.documents || []).map((doc: any) => ({
                    documentId: doc.documentId,
                    title: doc.title || doc.fileName || "",
                    fileName: doc.fileName || "",
                    fileSize: doc.fileSize,
                    createdByFullName: doc.createdByFullName
                }))
            });
        });
        return list;
    }, [rawAgendaItems, meeting]);

    const availableDocuments = useMemo(() => {
        const list = rawAgendaItems.flatMap(item => 
            (item.documents || []).map((doc: any) => ({
                value: doc.documentId,
                label: doc.title || doc.fileName || ""
            }))
        );
        if (meeting?.agendaFile) {
            list.unshift({
                value: meeting.agendaFile.id,
                label: meeting.agendaFile.name || "Chương trình họp"
            });
        }
        return list;
    }, [rawAgendaItems, meeting]);

    const availableContents = useMemo(() => {
        return rawAgendaItems.map(item => ({
            value: item.id.toString(),
            label: item.title
        }));
    }, [rawAgendaItems]);

    const opinions = useMemo<Opinion[]>(() => {
        return rawOpinions.map(op => {
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
    }, [rawOpinions]);

    const speakers = useMemo<Speaker[]>(() => {
        const attendeesList = [
            ...(rawAttendees.participants || []),
            ...(rawAttendees.guests || [])
        ];
        return rawSpeakersQueue
            .filter(q => q.queueStatus !== "CANCELLED" && q.queueStatus !== "EXPIRED")
            .map(q => {
                let status: "waiting" | "speaking" | "finished" | "rejected" = "waiting";
                if (q.queueStatus === "SPEAKING") status = "speaking";
                else if (q.queueStatus === "DONE") status = "finished";
                else if (q.queueStatus === "REJECTED") status = "rejected";

                const p = attendeesList.find((x: any) => x.userId === q.userId || x.guestId === q.userId || x.id === q.userId);

            return {
                id: q.id,
                name: q.userName || p?.fullName || "",
                position: p?.positionName || p?.position || "-",
                unit: p?.deptName || p?.company || "-",
                status,
                addedTime: q.requestedAt ? new Date(q.requestedAt).toLocaleTimeString("vi-VN") : "",
                activeTurnId: q.activeTurnId,
                speakingStartAt: q.speakingStartAt,
                durationSeconds: q.speakingDurationSeconds
            };
        });
    }, [rawSpeakersQueue, rawAttendees]);

    const currentSpeaker = useMemo(() => speakers.find((s) => s.status === "speaking"), [speakers]);
    const waitingSpeakers = useMemo(() => speakers.filter((s) => s.status === "waiting"), [speakers]);

    const votingIssues = useMemo<VotingIssue[]>(() => {
        const agendaItemOrder = new Map<string, number>();
        rawAgendaItems.forEach((item, idx) => {
            agendaItemOrder.set(String(item.id), idx);
        });

        const sortedMotions = [...rawMotions].sort((a, b) => {
            const idxA = agendaItemOrder.get(String(a.agendaItemId)) ?? 999;
            const idxB = agendaItemOrder.get(String(b.agendaItemId)) ?? 999;
            return idxA - idxB;
        });

        return sortedMotions.map(mot => {
            let status: "pending" | "broadcasting" | "voting" | "paused" | "completed" = "pending";
            if (mot.status === "SUBMITTED") {
                status = "voting";
            } else if (mot.status === "CLOSED") {
                status = "completed";
            }
            const agenda = rawAgendaItems.find(a => String(a.id) === String(mot.agendaItemId));
            const agendaStatus = agenda ? agenda.status : "DRAFT";
            const agendaTitle = agenda ? agenda.title : "";

            return {
                id: mot.id,
                issue: mot.title,
                time: "",
                status,
                broadcastEnabled: mot.status === "SUBMITTED" || mot.status === "CLOSED",
                votingDuration: mot.durationMinutes || 5,
                timeLeftSeconds: mot.timeLeftSeconds,
                options: mot.options,
                agendaItemId: mot.agendaItemId,
                agendaItemTitle: agendaTitle || mot.agendaItemTitle || "",
                agendaItemStatus: agendaStatus
            };
        });
    }, [rawMotions, rawAgendaItems]);

    const meetingParticipants = useMemo<Participant[]>(() => {
        return [
            ...(rawAttendees.participants || []).map((p: any) => ({
                id: p.userId,
                name: p.fullName || p.username,
                position: p.positionName || "-",
                unit: p.deptName || "-",
                attendanceStatus: p.attendanceStatus === "PRESENT" ? "present" as const : (p.attendanceStatus === "ABSENT" ? "absent" as const : "pending" as const),
                type: p.participantRole === 'CHAIR' || p.participantRole === 'CHAIRPERSON' ? 'individual' : 'unit'
            })),
            ...(rawAttendees.guests || []).map((g: any) => ({
                id: g.guestId || g.id,
                name: g.fullName,
                position: g.position || "-",
                unit: g.company || "-",
                attendanceStatus: g.attendanceStatus === "PRESENT" ? "present" as const : (g.attendanceStatus === "ABSENT" ? "absent" as const : "pending" as const),
                type: 'guest'
            }))
        ];
    }, [rawAttendees]);

    // Participants available for adding as speakers:
    // - Must have checked in (attendanceStatus === "present")
    // - Must NOT already be in the speaker queue with QUEUED or SPEAKING status
    const availableSpeakerParticipants = useMemo<Participant[]>(() => {
        const activeSpeakerUserIds = new Set(
            rawSpeakersQueue
                .filter(q => q.queueStatus === "QUEUED" || q.queueStatus === "SPEAKING")
                .map(q => String(q.userId))
        );
        return meetingParticipants.filter(
            p => p.attendanceStatus === "present" && !activeSpeakerUserIds.has(String(p.id))
        );
    }, [meetingParticipants, rawSpeakersQueue]);

    const mockDelegates = useMemo<Delegate[]>(() => {
        return meetingParticipants.map((p, idx) => ({
            id: idx + 1,
            name: p.name,
            position: p.position,
            unit: p.unit,
            isReady: p.attendanceStatus === "present"
        }));
    }, [meetingParticipants]);

    // Determine if user is Chair or Secretary for this meeting
    const isChairOrSecretary = useMemo(() => {
        if (!user) return false;

        const participants = rawAttendees.participants || [];
        const currentUserId = String(user.id);
        const userParticipant = participants.find((p: any) => String(p.userId) === currentUserId);
        if (!userParticipant) return false;
        return userParticipant.participantRole === 'CHAIR' || 
               userParticipant.participantRole === 'CHAIRPERSON' || 
               userParticipant.participantRole === 'SECRETARY';
    }, [user, rawAttendees]);

    // --- Speaker handlers ---
    const handleAddSpeakers = async (selectedParticipants: Participant[]) => {
        if (!checkAttendance()) return;
        if (selectedParticipants.length === 0) return;
        setDurationSelectedParticipants(selectedParticipants);
        setDurationModalType('add');
        setSpeakingDuration("5");
        setIsDurationModalOpen(true);
    };

    const handleEndSpeaking = async () => {
        if (!checkAttendance()) return;
        if (!currentSpeaker) return;
        try {
            const turnId = activeTurnId || currentSpeaker.activeTurnId;
            if (turnId) {
                await meetingApi.stopSpeakerTurn(id || "", turnId);
            } else {
                // Fallback to canceling/rejecting current speaker queue item if turnId is unknown
                await meetingApi.rejectSpeakRequest(id || "", currentSpeaker.id.toString());
            }
            setActiveTurnId(null);
            toast.success("Đã dừng phát biểu");
            refreshData();
        } catch (error) {
            toast.error("Không thể dừng phát biểu");
        }
    };

    const handlePrepareSpeech = async (speakerId: string | number) => {
        if (!checkAttendance()) return;
        try {
            await meetingApi.prepareSpeakerTurn(id || "", speakerId.toString());
            toast.success("Đã gửi yêu cầu chuẩn bị phát biểu");
            refreshData();
        } catch (error) {
            toast.error("Không thể gửi yêu cầu chuẩn bị phát biểu");
        }
    };

    const handleReorderSpeaker = async (speakerId: string | number, direction: 'up' | 'down') => {
        if (!checkAttendance()) return;
        // Lấy danh sách những người đang chờ phát biểu (status === 'waiting')
        const waitingList = speakers.filter(s => s.status === 'waiting');
        const index = waitingList.findIndex(s => s.id === speakerId);
        if (index === -1) return;

        const newWaitingList = [...waitingList];
        if (direction === 'up' && index > 0) {
            const temp = newWaitingList[index];
            newWaitingList[index] = newWaitingList[index - 1];
            newWaitingList[index - 1] = temp;
        } else if (direction === 'down' && index < newWaitingList.length - 1) {
            const temp = newWaitingList[index];
            newWaitingList[index] = newWaitingList[index + 1];
            newWaitingList[index + 1] = temp;
        } else {
            return;
        }

        try {
            const queueIds = newWaitingList.map(s => s.id.toString());
            await meetingApi.reorderSpeakersQueue(id || "", queueIds);
            toast.success("Đã thay đổi thứ tự phát biểu");
            refreshData();
        } catch (error) {
            toast.error("Không thể thay đổi thứ tự phát biểu");
        }
    };

    const handleAssignSpeech = async (speakerId: string | number) => {
        if (!checkAttendance()) return;
        setDurationTargetId(speakerId);
        setDurationModalType('assign');
        setSpeakingDuration("5");
        setIsDurationModalOpen(true);
    };

    const handleConfirmDuration = async () => {
        const minutes = parseInt(speakingDuration, 10);
        if (isNaN(minutes) || minutes <= 0) {
            toast.error("Thời gian phát biểu không hợp lệ (phải là số nguyên lớn hơn 0)");
            return;
        }

        try {
            if (durationModalType === 'assign' && durationTargetId) {
                const res = await meetingApi.startSpeakerTurn(id || "", durationTargetId.toString(), minutes);
                if (res.success && res.data) {
                    setActiveTurnId(res.data.id);
                }
                toast.success("Đã chuyển quyền phát biểu");
            } else if (durationModalType === 'add' && durationSelectedParticipants.length > 0) {
                for (const participant of durationSelectedParticipants) {
                    await meetingApi.startDirectSpeakerTurn(id || "", participant.id, minutes);
                }
                toast.success("Đã chỉ định phát biểu thành công");
                setIsAddSpeakerModalOpen(false);
            }
            refreshData();
            setIsDurationModalOpen(false);
            setDurationModalType(null);
            setDurationTargetId(null);
            setDurationSelectedParticipants([]);
        } catch (error) {
            toast.error("Không thể thiết lập lượt phát biểu");
        }
    };

    const handleRejectSpeech = async (speakerId: string | number) => {
        if (!checkAttendance()) return;
        const confirmReject = window.confirm("Bạn có chắc chắn muốn từ chối yêu cầu phát biểu này?");
        if (confirmReject) {
            try {
                await meetingApi.rejectSpeakRequest(id || "", speakerId.toString());
                toast.success("Đã từ chối yêu cầu phát biểu");
                refreshData();
            } catch (error) {
                toast.error("Không thể từ chối yêu cầu phát biểu");
            }
        }
    };

    // --- Self-register to speak (for regular members & guest substitutes) ---
    const handleRequestToSpeak = async () => {
        if (!checkAttendance()) return;
        try {
            let res;
            const agendaIdStr = activeContent && activeContent !== "GENERAL_AGENDA" ? activeContent.toString() : undefined;
            if (guestToken) {
                res = await meetingApi.publicRequestToSpeak(guestToken, agendaIdStr);
            } else {
                res = await meetingApi.requestToSpeak(id || "", agendaIdStr);
            }
            if (res.success) {
                toast.success("Đã đăng ký phát biểu thành công");
                refreshData();
            } else {
                toast.error(res.message || "Không thể đăng ký phát biểu");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Đã xảy ra lỗi khi đăng ký phát biểu");
        }
    };

    // --- Opinion handlers ---

    const canUserVote = useCallback((motion: any) => {
        if (!currentUserParticipant) return false;

        // 1. Secretary cannot vote
        const role = currentUserParticipant.role || currentUserParticipant.participantRole;
        if (role === 'SECRETARY') return false;

        const agendaId = motion.agendaItemId;
        if (!agendaId) return true; // Fallback if no agenda item is linked

        // 2. If current user is a guest (substitute)
        const isGuestUser = !!guestToken;
        if (isGuestUser) {
            // Guest is always a substitute in this scenario.
            // Check if the delegator they substitute for is absent for this agenda item.
            const delegatorId = currentUserParticipant.substituteForParticipantId;
            if (!delegatorId) return false;
            const delegator = (rawAttendees.participants || []).find((p: any) => p.id === delegatorId);
            if (!delegator) return false;
            const isDelegatorAbsent = delegator.inviteStatus === "DECLINED" && (delegator.isFullSession || 
                (delegator.absentAgendaItemIds && delegator.absentAgendaItemIds.includes(agendaId)));
            return isDelegatorAbsent;
        }

        // 3. If current user is an internal user (could be delegator, normal delegate, or internal substitute)
        const isSubstitute = currentUserParticipant.isSubstitute;
        if (isSubstitute) {
            const delegatorId = currentUserParticipant.substituteForParticipantId;
            if (!delegatorId) return false;
            const delegator = (rawAttendees.participants || []).find((p: any) => p.id === delegatorId);
            if (!delegator) return false;
            const isDelegatorAbsent = delegator.inviteStatus === "DECLINED" && (delegator.isFullSession || 
                (delegator.absentAgendaItemIds && delegator.absentAgendaItemIds.includes(agendaId)));
            return isDelegatorAbsent;
        }

        // Normal delegate
        const isAbsent = currentUserParticipant.inviteStatus === "DECLINED" && (currentUserParticipant.isFullSession || 
            (currentUserParticipant.absentAgendaItemIds && currentUserParticipant.absentAgendaItemIds.includes(agendaId)));
        if (isAbsent) {
            return false;
        }

        return true;
    }, [currentUserParticipant, rawAttendees, guestToken]);

    const [lastAutoOpenedMotionId, setLastAutoOpenedMotionId] = useState<string | null>(null);

    useEffect(() => {
        if (!rawMotions || rawMotions.length === 0) return;

        const activeMotion = rawMotions.find((m: any) => m.status === "SUBMITTED");
        if (activeMotion) {
            if (activeMotion.id !== lastAutoOpenedMotionId) {
                const canVote = canUserVote(activeMotion);
                if (canVote && !activeMotion.hasVoted) {
                    const issue: VotingIssue = {
                        id: activeMotion.id,
                        issue: activeMotion.title,
                        time: "",
                        status: "voting",
                        broadcastEnabled: true,
                        votingDuration: activeMotion.durationMinutes || 5,
                        timeLeftSeconds: activeMotion.timeLeftSeconds,
                        options: activeMotion.options,
                        agendaItemId: activeMotion.agendaItemId,
                        agendaItemTitle: activeMotion.agendaItemTitle
                    };
                    setCurrentVotingIssue(issue);
                    setIsVotingModalOpen(true);
                    setLastAutoOpenedMotionId(activeMotion.id);
                }
            }
        } else {
            setLastAutoOpenedMotionId(null);
            setIsVotingModalOpen(false);
        }
    }, [rawMotions, lastAutoOpenedMotionId, canUserVote]);

    // --- Voting handlers ---
    const handleToggleBroadcast = async (issueId: string | number) => {
        if (!checkAttendance()) return;
        const issue = votingIssues.find((i) => i.id === issueId);
        if (!issue) return;

        // Restriction: Only allow broadcasting if associated agenda item is IN_PROGRESS
        if (issue.agendaItemStatus !== "IN_PROGRESS" && !issue.broadcastEnabled) {
            toast.error("Chỉ được phát lệnh biểu quyết khi nội dung họp liên quan đang diễn ra!");
            return;
        }

        if (!issue.broadcastEnabled) {
            setCurrentVotingIssue(issue);
            setIsConfirmBroadcastModalOpen(true);
        } else {
            try {
                await meetingApi.stopVote(issueId.toString());
                toast.success("Đã đóng phiên biểu quyết");
                refreshData();
            } catch (error) {
                toast.error("Không thể đóng phiên biểu quyết");
            }
        }
    };

    const handleConfirmBroadcast = (checkReadiness: boolean) => {
        setIsConfirmBroadcastModalOpen(false);
        if (checkReadiness) {
            setIsReadinessCheckModalOpen(true);
        } else {
            setIsVotingTimeModalOpen(true);
        }
    };

    const handleProceedFromReadiness = () => {
        setIsReadinessCheckModalOpen(false);
        setIsVotingTimeModalOpen(true);
    };

    const handleConfirmVotingTime = async (minutes: number) => {
        if (!checkAttendance()) return;
        if (!currentVotingIssue) return;
        try {
            await meetingApi.startVote(currentVotingIssue.id.toString(), minutes);
            toast.success("Đã kích hoạt phiên biểu quyết thành công");
            setIsVotingTimeModalOpen(false);
            if (canUserVote(currentVotingIssue)) {
                setIsVotingModalOpen(true);
            }
            refreshData();
        } catch (error) {
            toast.error("Không thể bắt đầu biểu quyết");
        }
    };

    const handleVote = async (option: "agree" | "disagree" | "other", otherContent?: string) => {
        if (!checkAttendance()) return;
        if (!currentVotingIssue) return;

        const motion = rawMotions.find(m => m.id === currentVotingIssue.id);
        if (!motion || !motion.options || motion.options.length === 0) {
            toast.error("Không tìm thấy phương án biểu quyết trên hệ thống");
            return;
        }

        const targetLabel = option === "agree" ? "CÓ" : (option === "disagree" ? "KHÔNG" : "Ý KIẾN KHÁC");
        const voteOpt = motion.options.find((o: any) => o.label.toUpperCase() === targetLabel);

        if (!voteOpt) {
            toast.error("Không tìm thấy lựa chọn tương ứng");
            return;
        }

        try {
            if (guestToken) {
                await meetingApi.publicCastVote(currentVotingIssue.id.toString(), voteOpt.id, guestToken);
            } else {
                await meetingApi.castVote(currentVotingIssue.id.toString(), voteOpt.id);
            }
            toast.success("Đã thực hiện biểu quyết thành công");
            setIsVotingModalOpen(false);
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể thực hiện biểu quyết");
        }
    };

    const handlePauseVoting = (issueId: string | number) => {
        const issue = votingIssues.find((i) => i.id === issueId);
        if (!issue) return;
        setCurrentVotingIssue(issue);
        setIsPauseVotingModalOpen(true);
    };

    const handleConfirmPause = async () => {
        if (!checkAttendance()) return;
        if (!currentVotingIssue) return;
        try {
            await meetingApi.stopVote(currentVotingIssue.id.toString());
            toast.success("Đã dừng phiên biểu quyết thành công");
            setIsPauseVotingModalOpen(false);
            setCurrentVotingIssue(null);
            refreshData();
        } catch (error) {
            toast.error("Không thể dừng biểu quyết");
        }
    };

    const handleRevote = (issueId: string | number) => {
        const issue = votingIssues.find((i) => i.id === issueId);
        if (!issue) return;
        setCurrentVotingIssue(issue);
        setIsVotingTimeModalOpen(true);
    };

    const handleViewVotingResult = async (issueId: string | number) => {
        try {
            const res = guestToken
                ? await meetingApi.publicGetVoteStatistics(issueId.toString(), guestToken)
                : await meetingApi.getVoteStatistics(issueId.toString());
            if (res.success && res.data) {
                const mapped = mapVotingResults(res.data, meetingParticipants);
                setVotingResultData(mapped);
                // Ensure currentVotingIssue is set so toggle callback has motionId
                const issue = votingIssues.find(i => String(i.id) === String(issueId));
                if (issue) setCurrentVotingIssue(issue);
                setIsVotingResultModalOpen(true);
            }
        } catch (error) {
            toast.error("Không thể tải kết quả biểu quyết");
        }
    };

    const handleToggleVotingList = async (motionId: string | number, show: boolean) => {
        try {
            const res = await meetingApi.toggleVotingList(motionId.toString(), show);
            if (res.success && res.data) {
                const mapped = mapVotingResults(res.data, meetingParticipants);
                setVotingResultData(mapped);
            }
        } catch (error) {
            toast.error("Không thể cập nhật trạng thái hiển thị danh sách biểu quyết");
        }
    };

    // --- Content handlers ---
    const handleStartContent = async (contentId: string | number) => {
        if (!checkAttendance()) return;
        if (contentId === "GENERAL_AGENDA") return;
        try {
            await meetingApi.startAgenda(id || "", contentId.toString());
            toast.success("Đã bắt đầu điều hành nội dung họp");
            setIsStartContentModalOpen(false);
            refreshAgendaOnly();
        } catch (error) {
            toast.error("Không thể bắt đầu nội dung họp");
        }
    };

    const handleApproveContent = async (contentId: string | number, isApproved: boolean) => {
        if (!checkAttendance()) return;
        if (contentId === "GENERAL_AGENDA") return;
        try {
            if (isApproved) {
                await meetingApi.completeAgenda(id || "", contentId.toString());
                toast.success("Đã phê duyệt hoàn thành nội dung họp");
            } else {
                await meetingApi.skipAgenda(id || "", contentId.toString());
                toast.success("Đã bỏ qua nội dung họp");
            }
            setIsApproveContentModalOpen(false);
            refreshAgendaOnly();
        } catch (error) {
            toast.error("Không thể xử lý nội dung họp");
        }
    };

    const handleAddOpinionForContent = async (data: OpinionForContentData) => {
        if (!checkAttendance()) return;
        try {
            let documentIds: string[] = [];
            if (data.attachments && data.attachments.length > 0) {
                const uploadPromises = data.attachments.map(file => meetingApi.uploadDocument(file));
                const uploadResponses = await Promise.all(uploadPromises);
                documentIds = uploadResponses
                    .filter(res => res.success && res.data)
                    .map(res => res.data!.id);
            }

            const documentName = data.documentId
                ? availableDocuments.find((doc) => doc.value === data.documentId)?.label
                : undefined;

            if (guestToken) {
                await meetingApi.publicCreateOpinion(guestToken, {
                    opinionDetail: data.opinionDetail,
                    documentName,
                    documentIds
                });
            } else {
                await meetingApi.createOpinion(id || "", {
                    opinionDetail: data.opinionDetail,
                    documentName,
                    documentIds
                });
            }

            toast.success("Đã gửi ý kiến đóng góp thành công");
            setIsAddOpinionForContentModalOpen(false);
            refreshData();
        } catch (error) {
            toast.error("Không thể gửi ý kiến đóng góp");
        }
    };

    const handleViewOpinion = (opinion: Opinion) => {
        setSelectedViewOpinion(opinion);
        setIsViewOpinionModalOpen(true);
    };

    const handleCloseViewOpinion = () => {
        setSelectedViewOpinion(null);
        setIsViewOpinionModalOpen(false);
    };

    const handleOpenStartContent = () => {
        if (!checkAttendance()) return;
        const content = meetingContents.find((c) => c.id === activeContent);
        setSelectedContent(content || null);
        setIsStartContentModalOpen(true);
    };

    const handleOpenApproveContent = () => {
        if (!checkAttendance()) return;
        setIsApproveContentModalOpen(true);
    };
    
    const handleOpenAddOpinionForContent = () => {
        if (!checkAttendance()) return;
        setIsAddOpinionForContentModalOpen(true);
    };

    return {
        // State
        meeting,
        loading,
        error,
        isGuest,
        isSelfCheckedIn,
        isAbsentOnActiveContent,
        isWithinCheckInWindow,
        currentUserParticipant,
        activeContent, setActiveContent,
        activeTab, setActiveTab,
        opinions, speakers, votingIssues,
        selectedContent, setSelectedContent,
        currentVotingIssue,
        votingResultData,

        // Derived
        currentSpeaker, waitingSpeakers,
        meetingContents, availableDocuments, availableContents,
        mockDelegates, meetingParticipants, availableSpeakerParticipants,

        // Modal states
        isAddSpeakerModalOpen, setIsAddSpeakerModalOpen,
        isAttendanceModalOpen, setIsAttendanceModalOpen,
        isStartContentModalOpen, setIsStartContentModalOpen,
        isApproveContentModalOpen, setIsApproveContentModalOpen,
        isAddOpinionForContentModalOpen, setIsAddOpinionForContentModalOpen,
        isConfirmBroadcastModalOpen, setIsConfirmBroadcastModalOpen,
        isReadinessCheckModalOpen, setIsReadinessCheckModalOpen,
        isVotingTimeModalOpen, setIsVotingTimeModalOpen,
        isVotingModalOpen, setIsVotingModalOpen,
        isPauseVotingModalOpen, setIsPauseVotingModalOpen,
        isVotingResultModalOpen, setIsVotingResultModalOpen,
        isDurationModalOpen, setIsDurationModalOpen,
        isViewOpinionModalOpen, setIsViewOpinionModalOpen,
        selectedViewOpinion,

        // Handlers
        handleAddSpeakers, handleEndSpeaking,
        handlePrepareSpeech, handleAssignSpeech, handleRejectSpeech,
        handleReorderSpeaker,
        handleConfirmDuration,
        speakingDuration, setSpeakingDuration,
        handleToggleBroadcast, handleConfirmBroadcast,
        handleProceedFromReadiness, handleConfirmVotingTime,
        handleVote, handlePauseVoting, handleConfirmPause,
        handleRevote, handleViewVotingResult, handleToggleVotingList,
        handleStartContent, handleApproveContent,
        handleAddOpinionForContent,
        handleOpenStartContent, handleOpenApproveContent, handleOpenAddOpinionForContent,
        handleRequestToSpeak,
        handleSelfCheckIn,
        handleViewOpinion,
        handleCloseViewOpinion,
        isChairOrSecretary,
        checkAttendance,
        isAttendee: !!currentUserParticipant && currentUserParticipant.inviteStatus !== 'DECLINED',
    };
}
