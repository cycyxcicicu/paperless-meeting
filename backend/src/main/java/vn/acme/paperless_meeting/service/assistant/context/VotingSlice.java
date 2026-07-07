package vn.acme.paperless_meeting.service.assistant.context;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Motion;
import vn.acme.paperless_meeting.entity.VoteResult;
import vn.acme.paperless_meeting.entity.VoteResultOption;
import vn.acme.paperless_meeting.entity.VoteSession;
import vn.acme.paperless_meeting.repository.VoteSessionRepository;

/**
 * Dựng lát dữ liệu "Biểu quyết" cho Agent Biểu quyết: đề xuất, trạng thái phiên, kết
 * quả từng lựa chọn kèm tỷ lệ % (tính sẵn ở Java theo Từ điển dữ liệu, mục 6).
 */
@Component
@RequiredArgsConstructor
public class VotingSlice {

    private final VoteSessionRepository voteSessionRepository;

    public String build(UUID meetingId) {
        List<VoteSession> sessions = voteSessionRepository.findByMeetingIdWithMotionAndResult(meetingId);

        StringBuilder sb = new StringBuilder();
        sb.append("<danh_sach_bieu_quyet>\n");
        for (VoteSession session : sessions) {
            appendSession(sb, session);
        }
        sb.append("</danh_sach_bieu_quyet>\n");
        return sb.toString();
    }

    private void appendSession(StringBuilder sb, VoteSession session) {
        Motion motion = session.getMotion();
        AgendaItem agendaItem = motion != null ? motion.getAgendaItem() : null;
        VoteResult result = session.getVoteResult();

        String noiDung = agendaItem != null ? "Nội dung " + agendaItem.getOrderNo() + ": " + agendaItem.getTitle() : "-";
        String ketQua = result == null ? "Chưa có kết quả (phiên chưa đóng hoặc chưa tính)"
                : (Boolean.TRUE.equals(result.getPassed()) ? "Đã thông qua" : "Không được thông qua");

        sb.append("  <phien_bieu_quyet")
                .append(" noi_dung=\"").append(safe(noiDung)).append("\"")
                .append(" de_xuat=\"").append(motion != null ? safe(motion.getTitle()) : "-").append("\"")
                .append(" trang_thai=\"").append(session.getStatus() != null ? session.getStatus().getDescription() : "-").append("\"")
                .append(" loai=\"").append(session.getVoteType() != null ? session.getVoteType().getDescription() : "-").append("\"")
                .append(" ket_qua=\"").append(ketQua).append("\"")
                .append(">\n");

        Long totalValid = result != null ? result.getTotalValid() : null;
        for (VoteResultOption option : session.getVoteResultOptionList()) {
            sb.append("    <lua_chon")
                    .append(" nhan=\"").append(option.getOption() != null ? safe(option.getOption().getLabel()) : "-").append("\"")
                    .append(" so_phieu=\"").append(option.getVoteCount() != null ? option.getVoteCount() : 0).append("\"")
                    .append(" ty_le=\"").append(percentage(option.getVoteCount(), totalValid)).append("\"")
                    .append("/>\n");
        }

        sb.append("  </phien_bieu_quyet>\n");
    }

    private String percentage(Long count, Long total) {
        if (count == null || total == null || total == 0) {
            return "-";
        }
        BigDecimal pct = BigDecimal.valueOf(count)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP);
        return pct + "%";
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\"", "'");
    }
}
