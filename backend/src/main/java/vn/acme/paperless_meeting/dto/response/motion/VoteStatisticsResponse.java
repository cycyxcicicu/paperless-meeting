package vn.acme.paperless_meeting.dto.response.motion;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class VoteStatisticsResponse {
    private int totalVoters;      // Tổng số người tham gia cuộc họp (đại biểu)
    private int votedCount;       // Số người đã bỏ phiếu
    private int notVotedCount;    // Số người chưa bỏ phiếu
    private int yesCount;         // Số phiếu Đồng ý (CÓ)
    private int noCount;          // Số phiếu Không đồng ý (KHÔNG)
}
