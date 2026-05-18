import { useState } from "react";
import {
    Speaker, Opinion, VotingIssue, Delegate, Participant, MeetingContent,
    VotingResult, VotedDelegate, NotVotedDelegate,
    MOCK_DELEGATES, MOCK_PARTICIPANTS, MOCK_VOTING_ISSUES,
    MOCK_SPEAKERS, MOCK_AVAILABLE_DOCUMENTS, MOCK_MEETING_CONTENTS
} from '../meeting.mock';
import { OpinionData } from '@/modules/meeting/components/AddOpinionModal';
import { OpinionForContentData } from '@/modules/meeting/components/AddOpinionForContentModal';

export function useDienBienPhienHop() {
    const [activeContent, setActiveContent] = useState(1);
    const [activeTab, setActiveTab] = useState<"cho" | "bac-bo">("cho");
    const [isAddSpeakerModalOpen, setIsAddSpeakerModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isAddOpinionModalOpen, setIsAddOpinionModalOpen] = useState(false);
    const [isStartContentModalOpen, setIsStartContentModalOpen] = useState(false);
    const [isApproveContentModalOpen, setIsApproveContentModalOpen] = useState(false);
    const [isAddOpinionForContentModalOpen, setIsAddOpinionForContentModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState<MeetingContent | null>(null);

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
    } | null>(null);

    // Danh sách góp ý
    const [opinions, setOpinions] = useState<Opinion[]>([]);

    // Danh sách vấn đề cần biểu quyết
    const [votingIssues, setVotingIssues] = useState<VotingIssue[]>(MOCK_VOTING_ISSUES);

    // Mock delegates data
    const mockDelegates: Delegate[] = MOCK_DELEGATES;

    // Mock danh sách người tham gia cuộc họp
    const meetingParticipants: Participant[] = MOCK_PARTICIPANTS;

    // Danh sách người phát biểu
    const [speakers, setSpeakers] = useState<Speaker[]>(MOCK_SPEAKERS);

    // Người đang phát biểu
    const currentSpeaker = speakers.find((s) => s.status === "speaking");

    // Danh sách chờ phát biểu
    const waitingSpeakers = speakers.filter((s) => s.status === "waiting");

    // Meeting contents & documents
    const meetingContents: MeetingContent[] = MOCK_MEETING_CONTENTS;
    const availableDocuments = MOCK_AVAILABLE_DOCUMENTS;
    const availableContents = meetingContents.map((content) => ({
        value: content.id.toString(),
        label: content.title,
    }));

    // --- Speaker handlers ---
    const handleAddSpeakers = (selectedParticipants: Participant[]) => {
        const newSpeakers: Speaker[] = selectedParticipants.map((participant, index) => ({
            id: Date.now() + index,
            name: participant.name,
            position: participant.position,
            unit: participant.unit,
            note: "",
            status: currentSpeaker || index > 0 ? "waiting" : "speaking",
            addedTime: new Date().toLocaleString("vi-VN"),
            startTime: !currentSpeaker && index === 0 ? new Date().toLocaleString("vi-VN") : undefined,
        }));
        setSpeakers([...speakers, ...newSpeakers]);
        setIsAddSpeakerModalOpen(false);
    };

    const handleEndSpeaking = () => {
        if (!currentSpeaker) return;
        const updatedSpeakers = speakers.map((s) =>
            s.id === currentSpeaker.id ? { ...s, status: "finished" as const } : s
        );
        const nextSpeaker = waitingSpeakers[0];
        if (nextSpeaker) {
            const finalSpeakers = updatedSpeakers.map((s) =>
                s.id === nextSpeaker.id
                    ? { ...s, status: "speaking" as const, startTime: new Date().toLocaleString("vi-VN") }
                    : s
            );
            setSpeakers(finalSpeakers);
        } else {
            setSpeakers(updatedSpeakers);
        }
    };

    const handlePrepareSpeech = (speakerId: number) => {
        console.log("Chuẩn bị phát biểu cho speaker:", speakerId);
        alert(`Chuẩn bị phát biểu cho người phát biểu #${speakerId}`);
    };

    const handleAssignSpeech = (speakerId: number) => {
        console.log("Chỉ định phát biểu cho speaker:", speakerId);
        alert(`Chỉ định phát biểu cho người phát biểu #${speakerId}`);
    };

    const handleRejectSpeech = (speakerId: number) => {
        console.log("Bác bỏ phát biểu cho speaker:", speakerId);
        const confirmReject = window.confirm("Bạn có chắc chắn muốn bác bỏ phát biểu này?");
        if (confirmReject) {
            setSpeakers(speakers.filter((s) => s.id !== speakerId));
            alert(`Đã bác bỏ phát biểu #${speakerId}`);
        }
    };

    // --- Opinion handlers ---
    const handleAddOpinion = (data: OpinionData) => {
        const currentUser = { name: "Nguyễn Văn B", position: "Phó Giám đốc Sở" };
        const documentName = data.documentId
            ? availableDocuments.find((doc) => doc.value === data.documentId)?.label
            : undefined;

        const newOpinion: Opinion = {
            id: Date.now(),
            userName: currentUser.name,
            userPosition: currentUser.position,
            documentName,
            opinionDetail: data.opinionDetail,
            attachments: data.attachments.map((file) => ({ name: file.name, size: file.size })),
            createdAt: new Date().toLocaleString("vi-VN"),
        };

        setOpinions([...opinions, newOpinion]);
        setIsAddOpinionModalOpen(false);
    };

    // --- Voting handlers ---
    const handleToggleBroadcast = (issueId: number) => {
        const issue = votingIssues.find((i) => i.id === issueId);
        if (!issue) return;
        if (!issue.broadcastEnabled) {
            setCurrentVotingIssue(issue);
            setIsConfirmBroadcastModalOpen(true);
        } else {
            setVotingIssues(votingIssues.map((i) => (i.id === issueId ? { ...i, broadcastEnabled: false } : i)));
        }
    };

    const handleConfirmBroadcast = (checkReadiness: boolean) => {
        if (!currentVotingIssue) return;
        setVotingIssues(
            votingIssues.map((i) =>
                i.id === currentVotingIssue.id ? { ...i, broadcastEnabled: true, status: "broadcasting" as const } : i
            )
        );
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

    const handleConfirmVotingTime = (minutes: number) => {
        if (!currentVotingIssue) return;
        setVotingIssues(
            votingIssues.map((i) =>
                i.id === currentVotingIssue.id ? { ...i, votingDuration: minutes, status: "voting" as const } : i
            )
        );
        setIsVotingTimeModalOpen(false);
        setIsVotingModalOpen(true);
    };

    const handleVote = (option: "agree" | "disagree" | "other", otherContent?: string) => {
        const voteText =
            option === "agree" ? "Đồng ý" : option === "disagree" ? "Không đồng ý" : `Ý kiến khác: ${otherContent}`;
        alert(`Đã biểu quyết: ${voteText}`);
        setIsVotingModalOpen(false);
    };

    const handlePauseVoting = (issueId: number) => {
        const issue = votingIssues.find((i) => i.id === issueId);
        if (!issue) return;
        setCurrentVotingIssue(issue);
        setIsPauseVotingModalOpen(true);
    };

    const handleConfirmPause = () => {
        if (!currentVotingIssue) return;
        setVotingIssues(
            votingIssues.map((i) => (i.id === currentVotingIssue.id ? { ...i, status: "paused" as const } : i))
        );
        setIsPauseVotingModalOpen(false);
        setCurrentVotingIssue(null);
    };

    const handleRevote = (issueId: number) => {
        const issue = votingIssues.find((i) => i.id === issueId);
        if (!issue) return;
        setCurrentVotingIssue(issue);
        setIsVotingModalOpen(true);
    };

    const handleViewVotingResult = (issueId: number) => {
        const mockVotingResults: VotingResult = { agree: 35, disagree: 8, other: 5, notVoted: 12 };
        const mockVotedDelegates: VotedDelegate[] = [
            { id: 1, name: "Nguyễn Văn A", position: "Giám đốc", unit: "Sở Kế hoạch và Đầu tư", vote: "agree" },
            { id: 2, name: "Trần Thị B", position: "Phó Giám đốc", unit: "Sở Tài chính", vote: "agree" },
            { id: 3, name: "Lê Văn C", position: "Trưởng phòng", unit: "Sở Xây dựng", vote: "disagree" },
            { id: 4, name: "Phạm Thị D", position: "Giám đốc", unit: "Sở Giáo dục", vote: "agree" },
            { id: 5, name: "Hoàng Văn E", position: "Phó Giám đốc", unit: "Sở Y tế", vote: "other", otherContent: "Đề nghị bổ sung thêm khoản ngân sách dự phòng" },
            { id: 6, name: "Ngô Thị F", position: "Chuyên viên", unit: "Sở Nông nghiệp", vote: "agree" },
            { id: 7, name: "Vũ Văn G", position: "Trưởng phòng", unit: "Sở Công thương", vote: "disagree" },
            { id: 8, name: "Đặng Thị H", position: "Phó Giám đốc", unit: "Sở Văn hóa", vote: "agree" },
        ];
        const mockNotVotedDelegates: NotVotedDelegate[] = [
            { id: 9, name: "Bùi Văn I", position: "Giám đốc", unit: "Sở Thông tin và Truyền thông" },
            { id: 10, name: "Đinh Thị K", position: "Trưởng phòng", unit: "Sở Khoa học và Công nghệ" },
            { id: 11, name: "Hồ Văn L", position: "Phó Giám đốc", unit: "Sở Lao động" },
            { id: 12, name: "Mai Thị M", position: "Chuyên viên", unit: "Sở Tư pháp" },
        ];
        setVotingResultData({
            results: mockVotingResults,
            votedDelegates: mockVotedDelegates,
            notVotedDelegates: mockNotVotedDelegates,
        });
        setIsVotingResultModalOpen(true);
    };

    // --- Content handlers ---
    const handleStartContent = (contentId: number) => {
        console.log("Bắt đầu nội dung:", contentId);
        alert(`Đã bắt đầu nội dung #${contentId}`);
    };

    const handleApproveContent = (contentId: number, isApproved: boolean) => {
        console.log("Phê duyệt nội dung:", contentId, isApproved);
        if (isApproved) {
            alert(`Đã phê duyệt nội dung #${contentId}`);
        } else {
            alert(`Đã từ chối phê duyệt nội dung #${contentId}`);
        }
    };

    const handleAddOpinionForContent = (data: OpinionForContentData) => {
        console.log("Thêm góp ý cho nội dung:", data);
        alert(`Đã thêm góp ý cho nội dung ${data.contentId}`);
        setIsAddOpinionForContentModalOpen(false);
    };

    const handleOpenStartContent = () => {
        const content = meetingContents.find((c) => c.id === activeContent);
        setSelectedContent(content || null);
        setIsStartContentModalOpen(true);
    };

    const handleOpenApproveContent = () => setIsApproveContentModalOpen(true);
    const handleOpenAddOpinionForContent = () => setIsAddOpinionForContentModalOpen(true);

    return {
        // State
        activeContent, setActiveContent,
        activeTab, setActiveTab,
        opinions, speakers, votingIssues,
        selectedContent, setSelectedContent,
        currentVotingIssue,
        votingResultData,

        // Derived
        currentSpeaker, waitingSpeakers,
        meetingContents, availableDocuments, availableContents,
        mockDelegates, meetingParticipants,

        // Modal states
        isAddSpeakerModalOpen, setIsAddSpeakerModalOpen,
        isAttendanceModalOpen, setIsAttendanceModalOpen,
        isAddOpinionModalOpen, setIsAddOpinionModalOpen,
        isStartContentModalOpen, setIsStartContentModalOpen,
        isApproveContentModalOpen, setIsApproveContentModalOpen,
        isAddOpinionForContentModalOpen, setIsAddOpinionForContentModalOpen,
        isConfirmBroadcastModalOpen, setIsConfirmBroadcastModalOpen,
        isReadinessCheckModalOpen, setIsReadinessCheckModalOpen,
        isVotingTimeModalOpen, setIsVotingTimeModalOpen,
        isVotingModalOpen, setIsVotingModalOpen,
        isPauseVotingModalOpen, setIsPauseVotingModalOpen,
        isVotingResultModalOpen, setIsVotingResultModalOpen,

        // Handlers
        handleAddSpeakers, handleEndSpeaking,
        handlePrepareSpeech, handleAssignSpeech, handleRejectSpeech,
        handleAddOpinion,
        handleToggleBroadcast, handleConfirmBroadcast,
        handleProceedFromReadiness, handleConfirmVotingTime,
        handleVote, handlePauseVoting, handleConfirmPause,
        handleRevote, handleViewVotingResult,
        handleStartContent, handleApproveContent,
        handleAddOpinionForContent,
        handleOpenStartContent, handleOpenApproveContent, handleOpenAddOpinionForContent,
    };
}
