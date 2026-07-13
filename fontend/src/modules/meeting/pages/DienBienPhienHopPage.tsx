import { PageHeader } from "@/common/components/layout/PageHeader";
import { Button } from "@/common/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/common/components/ui/dialog";
import { LoadingOverlay } from "@/common/components/ui/LoadingOverlay";
import { AddOpinionForContentModal } from "@/modules/meeting/components/AddOpinionForContentModal";
import { ApproveContentModal } from "@/modules/meeting/components/ApproveContentModal";
import { AssistantChatPanel } from "@/modules/meeting/components/AssistantChatPanel";
import { AttendanceModal } from "@/modules/meeting/components/AttendanceModal";
import {
    MeetingContentsPanel,
    MeetingDetailPanel,
    OpinionSection,
    SpeakerSection,
    SpeakerTimerPanel,
    VotingSection,
} from "@/modules/meeting/components/dien-bien";
import { PersonalNotesModal } from "@/modules/meeting/components/PersonalNotesModal";
import { SelectSpeakerModal } from "@/modules/meeting/components/SelectSpeakerModal";
import { StartContentModal } from "@/modules/meeting/components/StartContentModal";
import { ViewOpinionModal } from "@/modules/meeting/components/ViewOpinionModal";
import { ConfirmBroadcastModal } from "@/modules/meeting/components/voting/ConfirmBroadcastModal";
import { PauseVotingModal } from "@/modules/meeting/components/voting/PauseVotingModal";
import { ReadinessCheckModal } from "@/modules/meeting/components/voting/ReadinessCheckModal";
import { VotingModal } from "@/modules/meeting/components/voting/VotingModal";
import { VotingResultModal } from "@/modules/meeting/components/voting/VotingResultModal";
import { VotingTimeModal } from "@/modules/meeting/components/voting/VotingTimeModal";
import {
    ArrowLeft,
    BookOpen,
    CalendarClock,
    CalendarX,
    Clock,
    Sparkles,
    Users,
    Vote,
} from "lucide-react";
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useDienBienPhienHop } from "../hooks/useDienBienPhienHop";

export default function DienBienPhienHopPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const searchParams = new URLSearchParams(location.search);
    const guestToken = searchParams.get("guestToken");

    const {
        activeContent,
        setActiveContent,
        activeTab,
        setActiveTab,
        opinions,
        speakers,
        votingIssues,
        selectedContent,
        setSelectedContent,
        currentVotingIssue,
        votingResultData,
        currentSpeaker,
        meetingContents,
        availableDocuments,
        availableContents,
        mockDelegates,
        meetingParticipants,
        availableSpeakerParticipants,
        isAddSpeakerModalOpen,
        setIsAddSpeakerModalOpen,
        isAttendanceModalOpen,
        setIsAttendanceModalOpen,
        isStartContentModalOpen,
        setIsStartContentModalOpen,
        isApproveContentModalOpen,
        setIsApproveContentModalOpen,
        isAddOpinionForContentModalOpen,
        setIsAddOpinionForContentModalOpen,
        isConfirmBroadcastModalOpen,
        setIsConfirmBroadcastModalOpen,
        isReadinessCheckModalOpen,
        setIsReadinessCheckModalOpen,
        isVotingTimeModalOpen,
        setIsVotingTimeModalOpen,
        isVotingModalOpen,
        setIsVotingModalOpen,
        isPauseVotingModalOpen,
        setIsPauseVotingModalOpen,
        isVotingResultModalOpen,
        setIsVotingResultModalOpen,
        isDurationModalOpen,
        setIsDurationModalOpen,
        isViewOpinionModalOpen,
        setIsViewOpinionModalOpen,
        selectedViewOpinion,
        speakingDuration,
        setSpeakingDuration,
        handleConfirmDuration,
        handleAddSpeakers,
        handleEndSpeaking,
        handlePrepareSpeech,
        handleAssignSpeech,
        handleRejectSpeech,
        handleReorderSpeaker,
        handleToggleBroadcast,
        handleConfirmBroadcast,
        handleProceedFromReadiness,
        handleConfirmVotingTime,
        handleVote,
        handlePauseVoting,
        handleConfirmPause,
        handleRevote,
        handleViewVotingResult,
        handleToggleVotingList,
        handleStartContent,
        handleApproveContent,
        handleAddOpinionForContent,
        handleOpenStartContent,
        handleOpenApproveContent,
        handleOpenAddOpinionForContent,
        handleViewOpinion,
        handleCloseViewOpinion,
        meeting,
        loading,
        error,
        isGuest,
        isSelfCheckedIn,
        isAbsentOnActiveContent,
        isWithinCheckInWindow,
        handleSelfCheckIn,
        handleRequestToSpeak,
        isChairOrSecretary,
        checkAttendance,
        isAttendee,
    } = useDienBienPhienHop(guestToken);

    const activeVoting = votingIssues.find(issue => issue.status === "voting");
    const showVoteFloatingButton = activeVoting && !activeVoting.hasVoted && !isVotingModalOpen;

    const [isNotesModalOpen, setIsNotesModalOpen] = React.useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);

    const errorCode = error?.response?.data?.code;

    if (errorCode === 1251) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center transition-all duration-300 hover:shadow-2xl">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
                        <CalendarClock className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                        Phiên họp chưa bắt đầu
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Thời gian diễn ra phiên họp chưa đến. Vui lòng kiểm tra
                        lại thời gian bắt đầu trong thư mời và truy cập lại sau.
                    </p>
                    <div className="bg-amber-50/50 rounded-2xl p-4 mb-8 border border-amber-100/50 text-left">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 block mb-1">
                            Lưu ý cho khách mời
                        </span>
                        <span className="text-xs text-amber-700 leading-relaxed">
                            Liên kết truy cập phòng họp chỉ khả dụng từ thời
                            điểm bắt đầu cuộc họp. Vui lòng không truy cập sớm
                            trước giờ quy định.
                        </span>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full bg-[#C8102E] hover:bg-[#a80d26] rounded-full py-6 text-base font-semibold shadow-lg shadow-red-500/20 transition-all duration-200"
                        onClick={() => window.location.reload()}
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                        Phiên họp đã kết thúc
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Phiên họp này đã hoàn thành hoặc đã bị hủy bỏ bởi Ban tổ
                        chức. Liên kết truy cập của bạn đã hết hạn khả dụng.
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100 text-left">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
                            Trạng thái liên kết
                        </span>
                        <span className="text-xs text-gray-500 leading-relaxed">
                            Quyền truy cập phòng họp dành cho khách mời tự động
                            đóng lại sau khi phiên họp kết thúc để đảm bảo an
                            toàn thông tin.
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
                            onClick={() => navigate("/")}
                        >
                            Quay lại Trang chủ
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (!loading && !isGuest && !isAttendee) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center transition-all duration-300 hover:shadow-2xl">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <CalendarX className="h-10 w-10 text-[#C8102E]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                        Không có quyền tham gia
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                        Bạn không có quyền tham gia phiên họp này hoặc đã từ
                        chối thư mời tham dự. Vui lòng liên hệ với Ban tổ chức
                        nếu có sự nhầm lẫn.
                    </p>
                    <Button
                        variant="primary"
                        className="w-full bg-[#C8102E] hover:bg-[#a80d26] rounded-full py-6 text-base font-semibold shadow-lg shadow-red-500/20 transition-all duration-200 text-white"
                        onClick={() => navigate("/")}
                    >
                        Quay lại Trang chủ
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            {loading && (
                <LoadingOverlay message="Đang tải diễn biến phiên họp..." />
            )}
            <div className="p-8">
                <PageHeader
                    title={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    navigate(
                                        `/phien-hop/${id}${isGuest ? `?guestToken=${guestToken}` : ""}`,
                                    )
                                }
                                className="text-gray-600 hover:text-[#C8102E] hover:bg-red-50 px-2 py-2 h-auto"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <span>Diễn biến phiên họp</span>
                        </div>
                    }
                    breadcrumbs={
                        isGuest
                            ? []
                            : [
                                  { name: "Trang chủ", path: "/" },
                                  { name: "Phiên họp", path: "/phien-hop" },
                                  {
                                      name: "Chi tiết phiên họp",
                                      path: `/phien-hop/${id}`,
                                  },
                                  { name: "Diễn biến phiên họp" },
                              ]
                    }
                    actions={
                        meeting?.status === "IN_PROGRESS" ||
                        isWithinCheckInWindow ? (
                            <Button
                                variant="outline"
                                className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full"
                                onClick={() => setIsAttendanceModalOpen(true)}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Danh sách điểm danh
                            </Button>
                        ) : null
                    }
                />

                {/* Banner cảnh báo điểm danh */}
                {!isSelfCheckedIn && isWithinCheckInWindow && isAttendee && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 animate-pulse" />
                            <div>
                                <h4 className="font-semibold text-amber-800 text-sm">
                                    Bạn chưa điểm danh tham dự cuộc họp
                                </h4>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Vui lòng điểm danh để có thể tham gia biểu
                                    quyết, đăng ký phát biểu và gửi ý kiến đóng
                                    góp.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-5 py-2 text-xs font-semibold shadow-md shadow-amber-600/10 whitespace-nowrap"
                            onClick={handleSelfCheckIn}
                        >
                            Điểm danh ngay
                        </Button>
                    </div>
                )}

                {/* Tên phiên họp */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl heading text-gray-900 uppercase mb-1">
                        {meeting?.title ||
                            "HỌP TRIỂN KHAI KẾ HOẠCH QUÝ II/2026"}
                    </h2>
                </div>

                {/* Layout 3 cột */}
                <div className="grid grid-cols-12 gap-5 mb-6">
                    {/* Cột trái */}
                    <div className="col-span-3 flex flex-col">
                        <MeetingContentsPanel
                            meetingContents={meetingContents}
                            activeContent={activeContent}
                            onSelectContent={setActiveContent}
                        />
                    </div>

                    {/* Cột giữa */}
                    <div className="col-span-5 flex flex-col">
                        <MeetingDetailPanel
                            meetingContents={meetingContents}
                            activeContent={activeContent}
                            onEndContent={(contentId) =>
                                handleApproveContent(contentId, true)
                            }
                            onOpenStart={handleOpenStartContent}
                            onOpenAddOpinionForContent={
                                handleOpenAddOpinionForContent
                            }
                            setSelectedContent={setSelectedContent}
                            setIsStartContentModalOpen={
                                setIsStartContentModalOpen
                            }
                            isGuest={isGuest}
                            meetingStatus={meeting?.status}
                            isChairOrSecretary={isChairOrSecretary}
                            isAttendee={isAttendee}
                            meeting={meeting}
                        />
                    </div>

                    {/* Cột phải */}
                    <div className="col-span-4 flex flex-col">
                        <SpeakerTimerPanel
                            currentSpeaker={currentSpeaker}
                            onEndSpeaking={handleEndSpeaking}
                            isGuest={isGuest}
                        />
                    </div>
                </div>

                {/* Sections full width */}
                <div className="space-y-6">
                    <SpeakerSection
                        speakers={speakers}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onAddSpeaker={() => {
                            if (checkAttendance())
                                setIsAddSpeakerModalOpen(true);
                        }}
                        onPrepareSpeech={handlePrepareSpeech}
                        onAssignSpeech={handleAssignSpeech}
                        onRejectSpeech={handleRejectSpeech}
                        onReorderSpeech={handleReorderSpeaker}
                        onEndSpeaking={handleEndSpeaking}
                        isGuest={isGuest}
                        meetingStatus={meeting?.status}
                        isChairOrSecretary={isChairOrSecretary}
                        onRequestToSpeak={handleRequestToSpeak}
                        isAttendee={isAttendee}
                        isAbsentOnActiveContent={isAbsentOnActiveContent}
                    />
                    <VotingSection
                        votingIssues={votingIssues}
                        onToggleBroadcast={handleToggleBroadcast}
                        onPauseVoting={handlePauseVoting}
                        onRevote={handleRevote}
                        onViewResult={handleViewVotingResult}
                        isGuest={isGuest}
                        meetingStatus={meeting?.status}
                        isChairOrSecretary={isChairOrSecretary}
                    />
                    <OpinionSection
                        opinions={opinions}
                        onAddOpinion={handleOpenAddOpinionForContent}
                        onViewOpinion={handleViewOpinion}
                        isGuest={isGuest}
                        meetingStatus={meeting?.status}
                        isAttendee={isAttendee}
                    />
                </div>
            </div>

            {/* === Modals === */}
            <SelectSpeakerModal
                isOpen={isAddSpeakerModalOpen}
                onClose={() => setIsAddSpeakerModalOpen(false)}
                onSelect={handleAddSpeakers}
                participants={availableSpeakerParticipants}
                existingSpeakerIds={[]}
                allowMultiple={true}
            />

            <AttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                meetingId={id || ""}
                guestToken={guestToken}
            />

            <ViewOpinionModal
                isOpen={isViewOpinionModalOpen}
                onClose={handleCloseViewOpinion}
                opinion={selectedViewOpinion}
                guestToken={guestToken}
            />

            {/* Inline Start Content Modal */}
            {isStartContentModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 99999,
                    }}
                    onClick={() => setIsStartContentModalOpen(false)}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            maxWidth: "500px",
                            width: "90%",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                marginBottom: "16px",
                            }}
                        >
                            Xác nhận bắt đầu nội dung
                        </h2>
                        {selectedContent && (
                            <>
                                <div
                                    style={{
                                        backgroundColor: "#dbeafe",
                                        border: "1px solid #93c5fd",
                                        borderRadius: "8px",
                                        padding: "16px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <p
                                        style={{
                                            fontWeight: "600",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        {selectedContent.title}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#4b5563",
                                        }}
                                    >
                                        {selectedContent.description}
                                    </p>
                                </div>
                                <div
                                    style={{
                                        backgroundColor: "#fef3c7",
                                        border: "1px solid #fcd34d",
                                        borderRadius: "8px",
                                        padding: "16px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#78350f",
                                        }}
                                    >
                                        Bắt đầu nội dung này sẽ kết thúc những
                                        nội dung đang họp khác, bạn có đồng ý
                                        không?
                                    </p>
                                </div>
                            </>
                        )}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                            }}
                        >
                            <button
                                onClick={() =>
                                    setIsStartContentModalOpen(false)
                                }
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    background: "white",
                                    cursor: "pointer",
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedContent) {
                                        handleStartContent(selectedContent.id);
                                    }
                                    setIsStartContentModalOpen(false);
                                }}
                                style={{
                                    padding: "8px 16px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#C8102E",
                                    color: "white",
                                    cursor: "pointer",
                                }}
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inline Approve Content Modal */}
            {isApproveContentModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 99999,
                    }}
                    onClick={() => setIsApproveContentModalOpen(false)}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            maxWidth: "500px",
                            width: "90%",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                marginBottom: "16px",
                            }}
                        >
                            Xác nhận phê duyệt nội dung
                        </h2>
                        <div
                            style={{
                                backgroundColor: "#f3f4f6",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "16px",
                                marginBottom: "16px",
                            }}
                        >
                            <p style={{ fontSize: "14px" }}>
                                Xác nhận phê duyệt cho nội dung{" "}
                                <strong>
                                    "
                                    {
                                        meetingContents.find(
                                            (c) => c.id === activeContent,
                                        )?.title
                                    }
                                    "
                                </strong>
                            </p>
                        </div>
                        <div style={{ marginBottom: "16px" }}>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    marginBottom: "8px",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="approval"
                                    defaultChecked
                                />
                                <span>Phê duyệt</span>
                            </label>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                }}
                            >
                                <input type="radio" name="approval" />
                                <span>Từ chối phê duyệt</span>
                            </label>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                            }}
                        >
                            <button
                                onClick={() =>
                                    setIsApproveContentModalOpen(false)
                                }
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    background: "white",
                                    cursor: "pointer",
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => {
                                    handleApproveContent(activeContent, true);
                                    setIsApproveContentModalOpen(false);
                                }}
                                style={{
                                    padding: "8px 16px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#C8102E",
                                    color: "white",
                                    cursor: "pointer",
                                }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other component modals */}
            <StartContentModal
                isOpen={false}
                onClose={() => setIsStartContentModalOpen(false)}
                content={selectedContent}
                onConfirm={handleStartContent}
            />
            <ApproveContentModal
                isOpen={false}
                onClose={() => setIsApproveContentModalOpen(false)}
                contentTitle={
                    meetingContents.find((c) => c.id === activeContent)
                        ?.title || ""
                }
                contentId={activeContent}
                onConfirm={handleApproveContent}
            />

            <AddOpinionForContentModal
                isOpen={isAddOpinionForContentModalOpen}
                onClose={() => setIsAddOpinionForContentModalOpen(false)}
                onAdd={handleAddOpinionForContent}
                contents={availableContents}
                documents={availableDocuments}
                defaultContentId={activeContent.toString()}
            />

            {/* Voting Modals */}
            <ConfirmBroadcastModal
                isOpen={isConfirmBroadcastModalOpen}
                onClose={() => setIsConfirmBroadcastModalOpen(false)}
                onConfirm={handleConfirmBroadcast}
                issueTitle={currentVotingIssue?.issue || ""}
            />
            <ReadinessCheckModal
                isOpen={isReadinessCheckModalOpen}
                onClose={() => setIsReadinessCheckModalOpen(false)}
                onProceed={handleProceedFromReadiness}
                issueTitle={currentVotingIssue?.issue || ""}
                delegates={mockDelegates}
            />
            <VotingTimeModal
                isOpen={isVotingTimeModalOpen}
                onClose={() => setIsVotingTimeModalOpen(false)}
                onConfirm={handleConfirmVotingTime}
            />
            <VotingModal
                isOpen={isVotingModalOpen}
                onClose={() => setIsVotingModalOpen(false)}
                onVote={handleVote}
                issueTitle={currentVotingIssue?.issue || ""}
                durationMinutes={currentVotingIssue?.votingDuration || 10}
                timeLeftSeconds={currentVotingIssue?.timeLeftSeconds}
            />
            <PauseVotingModal
                isOpen={isPauseVotingModalOpen}
                onClose={() => setIsPauseVotingModalOpen(false)}
                onConfirm={handleConfirmPause}
                issueTitle={currentVotingIssue?.issue || ""}
            />
            <VotingResultModal
                isOpen={isVotingResultModalOpen}
                onClose={() => setIsVotingResultModalOpen(false)}
                issueTitle={currentVotingIssue?.issue || "Vấn đề biểu quyết"}
                results={
                    votingResultData?.results || {
                        agree: 0,
                        disagree: 0,
                        other: 0,
                        notVoted: 0,
                    }
                }
                votedDelegates={votingResultData?.votedDelegates || []}
                notVotedDelegates={votingResultData?.notVotedDelegates || []}
                isAdmin={isChairOrSecretary}
                showVotingListSetting={
                    votingResultData?.showVotingList || false
                }
                onToggleVotingList={(show) =>
                    currentVotingIssue &&
                    handleToggleVotingList(currentVotingIssue.id, show)
                }
            />

            {/* Floating Vote Button */}
            {showVoteFloatingButton && (
                <div className="fixed right-6 bottom-64 z-40 group">
                    <button
                        type="button"
                        onClick={() => setIsVotingModalOpen(true)}
                        className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 relative border border-emerald-400/25 animate-pulse"
                    >
                        <Vote className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold items-center justify-center text-white">1</span>
                        </span>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 animate-in fade-in-0 slide-in-from-right-3 duration-200">
                        <div className="bg-gray-900 text-white text-xs rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-xl border border-gray-800 font-medium">
                            Đang biểu quyết - Bấm để bỏ phiếu
                            <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                        </div>
                    </div>
                </div>
            )}

            {!isGuest && isAttendee && (
                <>
                    {/* Floating AI Assistant Button */}
                    <div className="fixed right-6 bottom-44 z-40 group">
                        <button
                            type="button"
                            onClick={() => setIsAssistantOpen(true)}
                            className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 relative border border-indigo-400/25"
                        >
                            <Sparkles className="h-6 w-6" />
                        </button>
                        {/* Tooltip */}
                        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 animate-in fade-in-0 slide-in-from-right-3 duration-200">
                            <div className="bg-gray-900 text-white text-xs rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-xl border border-gray-800 font-medium">
                                Trợ lý AI cuộc họp
                                <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                            </div>
                        </div>
                    </div>

                    <AssistantChatPanel
                        isOpen={isAssistantOpen}
                        onClose={() => setIsAssistantOpen(false)}
                        meetingId={id || ""}
                        meetingTitle={meeting?.title || "Phiên họp"}
                    />

                    {/* Floating Book Button */}
                    <div className="fixed right-6 bottom-24 z-40 group">
                        <button
                            type="button"
                            onClick={() => setIsNotesModalOpen(true)}
                            className="w-14 h-14 bg-gradient-to-tr from-[#C8102E] to-[#E53E3E] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 relative border border-red-500/25"
                        >
                            <BookOpen className="h-6 w-6" />
                        </button>
                        {/* Tooltip */}
                        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 animate-in fade-in-0 slide-in-from-right-3 duration-200">
                            <div className="bg-gray-900 text-white text-xs rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-xl border border-gray-800 font-medium">
                                Ghi chú cuộc họp
                                <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                            </div>
                        </div>
                    </div>

                    <PersonalNotesModal
                        isOpen={isNotesModalOpen}
                        onClose={() => setIsNotesModalOpen(false)}
                        meetingId={id || ""}
                        meetingTitle={meeting?.title || "Phiên họp"}
                        agendaItems={meetingContents.map((c) => ({
                            id: String(c.id),
                            title: c.title,
                            description: c.description,
                        }))}
                    />
                </>
            )}

            {/* Speaking Duration Modal */}
            <Dialog
                open={isDurationModalOpen}
                onOpenChange={setIsDurationModalOpen}
            >
                <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Thiết lập thời gian phát biểu
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Thời gian phát biểu (phút){" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] text-sm"
                                placeholder="Nhập số phút phát biểu..."
                                value={speakingDuration}
                                onChange={(e) =>
                                    setSpeakingDuration(e.target.value)
                                }
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
