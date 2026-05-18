import React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, Users, X } from "lucide-react";
import { PageHeader } from '@/common/components/layout/PageHeader';
import { Button } from '@/common/components/ui/button';
import { SelectSpeakerModal } from '@/modules/meeting/components/SelectSpeakerModal';
import { AttendanceModal } from '@/modules/meeting/components/AttendanceModal';
import { AddOpinionModal } from '@/modules/meeting/components/AddOpinionModal';
import { AddOpinionForContentModal } from '@/modules/meeting/components/AddOpinionForContentModal';
import { ConfirmBroadcastModal } from '@/modules/meeting/components/voting/ConfirmBroadcastModal';
import { PauseVotingModal } from '@/modules/meeting/components/voting/PauseVotingModal';
import { ReadinessCheckModal } from '@/modules/meeting/components/voting/ReadinessCheckModal';
import { VotingModal } from '@/modules/meeting/components/voting/VotingModal';
import { VotingResultModal } from '@/modules/meeting/components/voting/VotingResultModal';
import { VotingTimeModal } from '@/modules/meeting/components/voting/VotingTimeModal';
import { StartContentModal } from '@/modules/meeting/components/StartContentModal';
import { ApproveContentModal } from '@/modules/meeting/components/ApproveContentModal';
import {
    MeetingContentsPanel,
    MeetingHistoryPanel,
    MeetingDetailPanel,
    SpeakerTimerPanel,
    VotingSection,
    OpinionSection,
    SpeakerSection,
} from '@/modules/meeting/components/dien-bien';
import { useDienBienPhienHop } from '../hooks/useDienBienPhienHop';
import { MeetingContent } from "../meeting.mock";

export default function DienBienPhienHopPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const {
        activeContent, setActiveContent,
        activeTab, setActiveTab,
        opinions, speakers, votingIssues,
        selectedContent, setSelectedContent,
        currentVotingIssue, votingResultData,
        currentSpeaker,
        meetingContents, availableDocuments, availableContents,
        mockDelegates, meetingParticipants,
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
        handleAddSpeakers, handleEndSpeaking,
        handlePrepareSpeech, handleAssignSpeech, handleRejectSpeech,
        handleAddOpinion,
        handleToggleBroadcast, handleConfirmBroadcast,
        handleProceedFromReadiness, handleConfirmVotingTime,
        handleVote, handlePauseVoting, handleConfirmPause,
        handleRevote, handleViewVotingResult,
        handleStartContent, handleApproveContent,
        handleAddOpinionForContent,
        handleOpenApproveContent, handleOpenAddOpinionForContent,
    } = useDienBienPhienHop();

    return (
        <>
            <div className="p-8">
                <PageHeader
                    title={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => navigate(`/phien-hop/${id}`)}
                                className="text-gray-600 hover:text-[#C8102E] hover:bg-red-50 px-2 py-2 h-auto"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <span>Diễn biến phiên họp</span>
                        </div>
                    }
                    description={
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>Thời gian: 17/04/2026 22:31 - 23:20</span>
                            </div>
                        </div>
                    }
                    breadcrumbs={[
                        { name: "Trang chủ", path: "/" },
                        { name: "Phiên họp", path: "/phien-hop" },
                        { name: "Chi tiết phiên họp", path: `/phien-hop/${id}` },
                        { name: "Diễn biến phiên họp" },
                    ]}
                    actions={
                        <Button
                            variant="primary"
                            className="bg-[#C8102E] hover:bg-[#a80d26]"
                            onClick={() => setIsAttendanceModalOpen(true)}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Điểm danh
                        </Button>
                    }
                />

                {/* Tên phiên họp */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl heading text-gray-900 uppercase mb-1">
                        HỌP TRIỂN KHAI KẾ HOẠCH QUÝ II/2026
                    </h2>
                </div>

                {/* Layout 3 cột */}
                <div className="grid grid-cols-12 gap-5 mb-6">
                    {/* Cột trái */}
                    <div className="col-span-3 flex flex-col gap-5">
                        <MeetingContentsPanel
                            meetingContents={meetingContents}
                            activeContent={activeContent}
                            onSelectContent={setActiveContent}
                        />
                        <MeetingHistoryPanel />
                    </div>

                    {/* Cột giữa */}
                    <div className="col-span-5 flex flex-col">
                        <MeetingDetailPanel
                            meetingContents={meetingContents}
                            activeContent={activeContent}
                            onOpenApprove={handleOpenApproveContent}
                            onOpenStart={() => {
                                const content = meetingContents.find((c) => c.id === activeContent);
                                setSelectedContent(content || null);
                                setIsStartContentModalOpen(true);
                            }}
                            onOpenAddOpinionForContent={handleOpenAddOpinionForContent}
                            setSelectedContent={setSelectedContent}
                            setIsStartContentModalOpen={setIsStartContentModalOpen}
                        />
                    </div>

                    {/* Cột phải */}
                    <div className="col-span-4 flex flex-col gap-5">
                        <SpeakerTimerPanel currentSpeaker={currentSpeaker} onEndSpeaking={handleEndSpeaking} />
                    </div>
                </div>

                {/* Sections full width */}
                <div className="space-y-6">
                    <VotingSection
                        votingIssues={votingIssues}
                        onToggleBroadcast={handleToggleBroadcast}
                        onPauseVoting={handlePauseVoting}
                        onRevote={handleRevote}
                        onViewResult={handleViewVotingResult}
                    />
                    <OpinionSection opinions={opinions} onAddOpinion={() => setIsAddOpinionModalOpen(true)} />
                    <SpeakerSection
                        speakers={speakers}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onAddSpeaker={() => setIsAddSpeakerModalOpen(true)}
                        onPrepareSpeech={handlePrepareSpeech}
                        onAssignSpeech={handleAssignSpeech}
                        onRejectSpeech={handleRejectSpeech}
                    />
                </div>
            </div>

            {/* === Modals === */}
            <SelectSpeakerModal
                isOpen={isAddSpeakerModalOpen}
                onClose={() => setIsAddSpeakerModalOpen(false)}
                onSelect={handleAddSpeakers}
                participants={meetingParticipants}
                existingSpeakerIds={speakers.map((s) => s.id)}
                allowMultiple={true}
            />

            <AttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
            />

            <AddOpinionModal
                isOpen={isAddOpinionModalOpen}
                onClose={() => setIsAddOpinionModalOpen(false)}
                onAdd={handleAddOpinion}
                documents={availableDocuments}
            />

            {/* Inline Start Content Modal */}
            {isStartContentModalOpen && (
                <div
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}
                    onClick={() => setIsStartContentModalOpen(false)}
                >
                    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", maxWidth: "500px", width: "90%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Xác nhận bắt đầu nội dung</h2>
                        {selectedContent && (
                            <>
                                <div style={{ backgroundColor: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                                    <p style={{ fontWeight: "600", marginBottom: "4px" }}>{selectedContent.title}</p>
                                    <p style={{ fontSize: "14px", color: "#4b5563" }}>{selectedContent.description}</p>
                                </div>
                                <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                                    <p style={{ fontSize: "14px", color: "#78350f" }}>Bắt đầu nội dung này sẽ kết thúc những nội dung đang họp khác, bạn có đồng ý không?</p>
                                </div>
                            </>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button onClick={() => setIsStartContentModalOpen(false)} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", cursor: "pointer" }}>Hủy bỏ</button>
                            <button onClick={() => { if (selectedContent) { handleStartContent(selectedContent.id); } setIsStartContentModalOpen(false); }} style={{ padding: "8px 16px", border: "none", borderRadius: "8px", background: "#C8102E", color: "white", cursor: "pointer" }}>Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inline Approve Content Modal */}
            {isApproveContentModalOpen && (
                <div
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}
                    onClick={() => setIsApproveContentModalOpen(false)}
                >
                    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", maxWidth: "500px", width: "90%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Xác nhận phê duyệt nội dung</h2>
                        <div style={{ backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                            <p style={{ fontSize: "14px" }}>Xác nhận phê duyệt cho nội dung <strong>"{meetingContents.find((c) => c.id === activeContent)?.title}"</strong></p>
                        </div>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "8px", cursor: "pointer" }}>
                                <input type="radio" name="approval" defaultChecked />
                                <span>Phê duyệt</span>
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer" }}>
                                <input type="radio" name="approval" />
                                <span>Từ chối phê duyệt</span>
                            </label>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button onClick={() => setIsApproveContentModalOpen(false)} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: "8px", background: "white", cursor: "pointer" }}>Hủy bỏ</button>
                            <button onClick={() => { handleApproveContent(activeContent, true); setIsApproveContentModalOpen(false); }} style={{ padding: "8px 16px", border: "none", borderRadius: "8px", background: "#C8102E", color: "white", cursor: "pointer" }}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other component modals */}
            <StartContentModal isOpen={false} onClose={() => setIsStartContentModalOpen(false)} content={selectedContent} onConfirm={handleStartContent} />
            <ApproveContentModal isOpen={false} onClose={() => setIsApproveContentModalOpen(false)} contentTitle={meetingContents.find((c) => c.id === activeContent)?.title || ""} contentId={activeContent} onConfirm={handleApproveContent} />

            <AddOpinionForContentModal
                isOpen={isAddOpinionForContentModalOpen}
                onClose={() => setIsAddOpinionForContentModalOpen(false)}
                onAdd={handleAddOpinionForContent}
                contents={availableContents}
                documents={availableDocuments}
                defaultContentId={activeContent.toString()}
            />

            {/* Voting Modals */}
            <ConfirmBroadcastModal isOpen={isConfirmBroadcastModalOpen} onClose={() => setIsConfirmBroadcastModalOpen(false)} onConfirm={handleConfirmBroadcast} issueTitle={currentVotingIssue?.issue || ""} />
            <ReadinessCheckModal isOpen={isReadinessCheckModalOpen} onClose={() => setIsReadinessCheckModalOpen(false)} onProceed={handleProceedFromReadiness} issueTitle={currentVotingIssue?.issue || ""} delegates={mockDelegates} />
            <VotingTimeModal isOpen={isVotingTimeModalOpen} onClose={() => setIsVotingTimeModalOpen(false)} onConfirm={handleConfirmVotingTime} />
            <VotingModal isOpen={isVotingModalOpen} onClose={() => setIsVotingModalOpen(false)} onVote={handleVote} issueTitle={currentVotingIssue?.issue || ""} durationMinutes={currentVotingIssue?.votingDuration || 10} />
            <PauseVotingModal isOpen={isPauseVotingModalOpen} onClose={() => setIsPauseVotingModalOpen(false)} onConfirm={handleConfirmPause} issueTitle={currentVotingIssue?.issue || ""} />
            <VotingResultModal
                isOpen={isVotingResultModalOpen}
                onClose={() => setIsVotingResultModalOpen(false)}
                issueTitle={currentVotingIssue?.issue || "Vấn đề biểu quyết"}
                results={votingResultData?.results || { agree: 0, disagree: 0, other: 0, notVoted: 0 }}
                votedDelegates={votingResultData?.votedDelegates || []}
                notVotedDelegates={votingResultData?.notVotedDelegates || []}
            />
        </>
    );
}
