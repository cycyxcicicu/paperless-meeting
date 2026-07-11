package vn.acme.paperless_meeting.service.assistant.context;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.Motion;
import vn.acme.paperless_meeting.entity.VoteBallot;
import vn.acme.paperless_meeting.entity.VoteBallotChoice;
import vn.acme.paperless_meeting.entity.VoteResult;
import vn.acme.paperless_meeting.entity.VoteResultOption;
import vn.acme.paperless_meeting.entity.VoteSession;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.VoteBallotRepository;
import vn.acme.paperless_meeting.repository.VoteSessionRepository;

/**
 * Dựng lát dữ liệu "Biểu quyết" cho Agent Biểu quyết: đề xuất, trạng thái phiên, kết
 * quả từng lựa chọn kèm tỷ lệ % (tính sẵn ở Java theo Từ điển dữ liệu, mục 6). Chi
 * tiết AI ĐÃ BỎ PHIẾU GÌ chỉ được đính kèm khi người hỏi có quyền xem (Chủ trì/Thư ký,
 * hoặc phiên đã bật "hiển thị danh sách biểu quyết" cho đại biểu) - ĐÚNG BẰNG quy tắc
 * hiển thị đang áp dụng ở MotionService#getVoteStatisticsInternal cho giao diện thường,
 * để trợ lý AI không trở thành đường vòng lộ phiếu kín mà chính người hỏi không xem
 * được ở UI.
 */
@Component
@RequiredArgsConstructor
public class VotingSlice {

    private final MeetingRepository meetingRepository;
    private final VoteSessionRepository voteSessionRepository;
    private final VoteBallotRepository voteBallotRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;

    public String build(UUID meetingId, UUID callerId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
        List<VoteSession> sessions = voteSessionRepository.findByMeetingIdWithMotionAndResult(meetingId);
        boolean isAdmin = callerId != null && meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, callerId)
                .map(p -> p.getParticipantRole() == ParticipantRole.CHAIR || p.getParticipantRole() == ParticipantRole.SECRETARY)
                .orElse(false);

        StringBuilder sb = new StringBuilder();
        sb.append("<cuoc_hop trang_thai=\"").append(meeting.getStatus() != null ? meeting.getStatus().getDescription() : "-")
                .append("\">Trạng thái này cho biết cuộc họp đã diễn ra hay chưa - phiên biểu quyết chỉ có thể "
                        + "diễn ra SAU KHI cuộc họp đã bắt đầu (trạng thái \"Đang tiến hành\" hoặc \"Đã kết thúc\")."
                        + "</cuoc_hop>\n");
        sb.append("<danh_sach_bieu_quyet>\n");
        for (VoteSession session : sessions) {
            appendSession(sb, session, isAdmin);
        }
        sb.append("</danh_sach_bieu_quyet>\n");
        return sb.toString();
    }

    private void appendSession(StringBuilder sb, VoteSession session, boolean isAdmin) {
        Motion motion = session.getMotion();
        AgendaItem agendaItem = motion != null ? motion.getAgendaItem() : null;
        VoteResult result = session.getVoteResult();

        String noiDung = agendaItem != null ? "Nội dung " + agendaItem.getOrderNo() + ": " + agendaItem.getTitle() : "-";
        String ketQua = result == null ? "Chưa có kết quả (phiên chưa đóng hoặc chưa tính)"
                : (Boolean.TRUE.equals(result.getPassed()) ? "Đã thông qua" : "Không được thông qua");
        boolean canSeeWhoVoted = isAdmin || Boolean.TRUE.equals(session.getShowVotingList());

        sb.append("  <phien_bieu_quyet")
                .append(" noi_dung=\"").append(safe(noiDung)).append("\"")
                .append(" de_xuat=\"").append(motion != null ? safe(motion.getTitle()) : "-").append("\"")
                .append(" trang_thai=\"").append(session.getStatus() != null ? session.getStatus().getDescription() : "-").append("\"")
                .append(" loai=\"").append(session.getVoteType() != null ? session.getVoteType().getDescription() : "-").append("\"")
                .append(" ket_qua=\"").append(ketQua).append("\"")
                .append(" xem_duoc_ai_bo_phieu=\"").append(canSeeWhoVoted ? "Có" : "Không").append("\"")
                .append(">\n");

        Long totalValid = result != null ? result.getTotalValid() : null;
        for (VoteResultOption option : session.getVoteResultOptionList()) {
            sb.append("    <lua_chon")
                    .append(" nhan=\"").append(option.getOption() != null ? safe(option.getOption().getLabel()) : "-").append("\"")
                    .append(" so_phieu=\"").append(option.getVoteCount() != null ? option.getVoteCount() : 0).append("\"")
                    .append(" ty_le=\"").append(percentage(option.getVoteCount(), totalValid)).append("\"")
                    .append("/>\n");
        }

        if (canSeeWhoVoted) {
            List<VoteBallot> ballots = voteBallotRepository.findByVoteSessionIdWithDetails(session.getId());
            for (VoteBallot ballot : ballots) {
                if (Boolean.FALSE.equals(ballot.getIsValid())) {
                    continue;
                }
                String hoTen = ballot.getGuest() != null ? ballot.getGuest().getFullName()
                        : (ballot.getUser() != null ? ballot.getUser().getFullName() : "-");
                String luaChon = "-";
                List<VoteBallotChoice> choices = ballot.getVoteBallotChoiceList();
                if (choices != null && !choices.isEmpty() && choices.get(0).getOption() != null) {
                    luaChon = choices.get(0).getOption().getLabel();
                }
                sb.append("    <nguoi_bo_phieu")
                        .append(" ho_ten=\"").append(safe(hoTen)).append("\"")
                        .append(" lua_chon=\"").append(safe(luaChon)).append("\"")
                        .append("/>\n");
            }
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
