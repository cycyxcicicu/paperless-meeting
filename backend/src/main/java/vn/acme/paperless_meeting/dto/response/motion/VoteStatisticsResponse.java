package vn.acme.paperless_meeting.dto.response.motion;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@Builder
public class VoteStatisticsResponse {
    private int totalVoters;      // Tổng số người tham gia cuộc họp (đại biểu)
    private int votedCount;       // Số người đã bỏ phiếu
    private int notVotedCount;    // Số người chưa bỏ phiếu
    private int yesCount;         // Số phiếu Đồng ý (CÓ)
    private int noCount;          // Số phiếu Không đồng ý (KHÔNG)
    private int otherCount;       // Số phiếu Ý kiến khác (Ý KIẾN KHÁC)
    private boolean showVotingList; // Cho phép xem danh sách biểu quyết hay không

    private List<VotedDelegateDto> votedDelegates;
    private List<NotVotedDelegateDto> notVotedDelegates;

    @Getter
    @Setter
    @Builder
    public static class VotedDelegateDto {
        private String id;
        private String name;
        private String position;
        private String unit;
        private String vote; // "agree" | "disagree" | "other"
    }

    @Getter
    @Setter
    @Builder
    public static class NotVotedDelegateDto {
        private String id;
        private String name;
        private String position;
        private String unit;
    }
}
