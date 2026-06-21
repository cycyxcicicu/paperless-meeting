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
}

/**
 * Xử lý dữ liệu thống kê biểu quyết từ backend thành kết quả chi tiết cho giao diện.
 * Giữ nguyên thuật toán mock slice mảng đại biểu để không làm đổi logic hiện tại.
 */
export const mapVotingResults = (
    stats: VoteStatsInput,
    meetingParticipants: any[]
): {
    results: VotingResult;
    votedDelegates: VotedDelegate[];
    notVotedDelegates: NotVotedDelegate[];
} => {
    const results: VotingResult = {
        agree: stats.yesCount,
        disagree: stats.noCount,
        other: 0,
        notVoted: stats.notVotedCount
    };

    const eligibleParticipants = meetingParticipants.filter(p => p.type !== 'guest');

    const votedDelegates: VotedDelegate[] = eligibleParticipants.slice(0, stats.votedCount).map((p, idx) => ({
        id: idx + 1,
        name: p.name,
        position: p.position,
        unit: p.unit,
        vote: idx % 2 === 0 ? "agree" : "disagree"
    }));

    const notVotedDelegates: NotVotedDelegate[] = eligibleParticipants.slice(stats.votedCount).map((p, idx) => ({
        id: idx + 100,
        name: p.name,
        position: p.position,
        unit: p.unit
    }));

    return {
        results,
        votedDelegates,
        notVotedDelegates
    };
};
