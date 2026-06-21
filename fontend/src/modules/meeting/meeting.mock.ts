
// Interfaces
export interface Speaker {
    id: string | number;
    name: string;
    position: string;
    unit: string;
    note?: string;
    startTime?: string;
    status: "waiting" | "speaking" | "finished" | "rejected";
    addedTime: string;
}

export interface Opinion {
    id: string | number;
    userName: string;
    userPosition: string;
    documentName?: string;
    opinionDetail: string;
    attachments: { name: string; size: number }[];
    createdAt: string;
}

export interface VotingIssue {
    id: string | number;
    issue: string;
    time: string;
    status: "pending" | "broadcasting" | "voting" | "paused" | "completed";
    broadcastEnabled: boolean;
    votingDuration?: number;
    options?: { id: string; label: string }[];
    agendaItemId?: string;
    agendaItemTitle?: string;
    agendaItemStatus?: string;
}

export interface Delegate {
    id: string | number;
    unit: string;
    name: string;
    position: string;
    isReady: boolean;
}

export interface Participant {
    id: string;
    name: string;
    position: string;
    unit: string;
    attendanceStatus?: string;
    type: "individual" | "unit" | "guest" | "group";
}

export interface MeetingContent {
    id: string | number;
    title: string;
    description: string;
    status?: 'DRAFT' | 'PENDING_PREPARATION' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
    durationEst?: number;
    preparedByFullName?: string;
    startTime?: string;
    endTime?: string;
    documents?: {
        documentId: string;
        title: string;
        fileName: string;
        fileSize?: number;
    }[];
}

export interface VotingResult {
    agree: number;
    disagree: number;
    other: number;
    notVoted: number;
}

export interface VotedDelegate {
    id: string | number;
    name: string;
    position: string;
    unit: string;
    vote: "agree" | "disagree" | "other";
    otherContent?: string;
}

export interface NotVotedDelegate {
    id: string | number;
    name: string;
    position: string;
    unit: string;
}

// Mock Data
export const MOCK_DELEGATES: Delegate[] = [
    { id: 1, unit: "Sở Kế hoạch và Đầu tư", name: "Nguyễn Văn A", position: "Giám đốc", isReady: true },
    { id: 2, unit: "Sở Tài chính", name: "Trần Thị B", position: "Phó Giám đốc", isReady: true },
    { id: 3, unit: "Sở Xây dựng", name: "Lê Văn C", position: "Trưởng phòng", isReady: false },
    { id: 4, unit: "Sở Giáo dục", name: "Phạm Thị D", position: "Giám đốc", isReady: true },
    { id: 5, unit: "Sở Y tế", name: "Hoàng Văn E", position: "Phó Giám đốc", isReady: true },
];

export const MOCK_PARTICIPANTS: Participant[] = [
    { id: "p-1", name: "Nguyễn Văn A", position: "Phó Chủ tịch UBND", unit: "Sở Kế hoạch và Đầu tư", attendanceStatus: "Tham gia", type: "individual" },
    { id: "p-2", name: "Trần Thị B", position: "Trưởng phòng", unit: "Sở Tài chính", attendanceStatus: "Tham gia", type: "unit" },
    { id: "p-3", name: "Lê Văn C", position: "Chuyên viên", unit: "Sở Xây dựng", attendanceStatus: "Tham gia", type: "individual" },
    { id: "p-4", name: "Phạm Thị D", position: "Giám đốc", unit: "Sở Giáo dục", attendanceStatus: "Tham gia", type: "unit" },
    { id: "p-5", name: "Hoàng Văn E", position: "Cố vấn", unit: "Công ty ABC", attendanceStatus: "Khách mời", type: "guest" },
];

export const MOCK_VOTING_ISSUES: VotingIssue[] = [
    {
        id: 1,
        issue: "Giải trình về việc cơ quan nhà nước cung cấp, giải thích, làm rõ thông tin liên quan đến dự án đầu tư công",
        time: "10:00:00",
        status: "pending",
        broadcastEnabled: false,
    },
];

export const MOCK_SPEAKERS: Speaker[] = [
    {
        id: 1,
        name: "Nguyễn Văn A",
        position: "Phó Chủ tịch UBND",
        unit: "Sở Kế hoạch và Đầu tư",
        startTime: "17/04/2026 22:40",
        status: "speaking",
        addedTime: "17/04/2026 22:35",
    },
];

export const MOCK_AVAILABLE_DOCUMENTS = [
    { value: "doc-1", label: "Báo cáo tình hình kinh tế - xã hội Quý 1.pdf" },
    { value: "doc-2", label: "Kế hoạch triển khai Quý 2 chi tiết.docx" },
];

export const MOCK_MEETING_CONTENTS: MeetingContent[] = [
    { id: 1, title: "Nội dung 1", description: "Báo cáo tình hình kinh tế - xã hội Quý 1/2026" },
    { id: 2, title: "Nội dung 2", description: "Triển khai kế hoạch quý II/2026" },
];

export const getMeetingStatus = (meetingId: string | undefined) => {
    if (!meetingId) return "Đang diễn ra";
    const finishedIds = ["3", "7", "10"];
    const draftIds = ["31", "32"];
    const upcomingIds = ["1", "5", "8"];
    if (finishedIds.includes(meetingId)) return "Đã kết thúc";
    if (draftIds.includes(meetingId)) return "Nháp";
    if (upcomingIds.includes(meetingId)) return "Sắp diễn ra";
    return "Đang diễn ra";
};
