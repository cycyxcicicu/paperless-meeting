import { VotingResult, VotedDelegate, NotVotedDelegate } from '../meeting.mock';

/**
 * Chuyển đổi trạng thái cuộc họp sang tiếng Việt.
 */
export const mapMeetingStatusVi = (statusStr: string): string => {
    switch (statusStr) {
        case "DRAFT":
            return "Nháp";
        case "PENDING_APPROVAL":
            return "Chờ phê duyệt";
        case "APPROVED":
            return "Đã phê duyệt";
        case "UPCOMING":
            return "Sắp diễn ra";
        case "IN_PROGRESS":
            return "Đang diễn ra";
        case "CLOSED":
            return "Đã kết thúc";
        case "CANCELLED":
            return "Đã hủy";
        case "REJECTED":
            return "Bị từ chối";
        case "EXPIRED":
            return "Đã hết hạn";
        default:
            return statusStr;
    }
};

interface VoteStatsInput {
    yesCount: number;
    noCount: number;
    notVotedCount: number;
    votedCount: number;
    otherCount?: number;
    showVotingList?: boolean;
    votedDelegates?: any[];
    notVotedDelegates?: any[];
}

/**
 * Xử lý dữ liệu thống kê biểu quyết từ backend thành kết quả chi tiết cho giao diện.
 * Sử dụng danh sách delegate thực tế từ API thay vì dữ liệu giả.
 */
export const mapVotingResults = (
    stats: VoteStatsInput,
    _meetingParticipants: any[]
): {
    results: VotingResult;
    votedDelegates: VotedDelegate[];
    notVotedDelegates: NotVotedDelegate[];
    showVotingList: boolean;
} => {
    const results: VotingResult = {
        agree: stats.yesCount,
        disagree: stats.noCount,
        other: stats.otherCount || 0,
        notVoted: stats.notVotedCount
    };

    const showVotingList = !!stats.showVotingList;

    // Use backend-provided delegate lists
    const votedDelegates: VotedDelegate[] = (stats.votedDelegates || []).map((p: any, idx: number) => ({
        id: p.id || idx + 1,
        name: p.name || "",
        position: p.position || "-",
        unit: p.unit || "-",
        vote: (p.vote === "agree" || p.vote === "disagree" || p.vote === "other") ? p.vote : "other"
    }));

    const notVotedDelegates: NotVotedDelegate[] = (stats.notVotedDelegates || []).map((p: any, idx: number) => ({
        id: p.id || idx + 100,
        name: p.name || "",
        position: p.position || "-",
        unit: p.unit || "-"
    }));

    return {
        results,
        votedDelegates,
        notVotedDelegates,
        showVotingList
    };
};
