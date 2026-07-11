package vn.acme.paperless_meeting.service.assistant.context;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.AgendaItemFeedback;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.Minutes;
import vn.acme.paperless_meeting.entity.Opinion;
import vn.acme.paperless_meeting.entity.SpeakerTurn;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AgendaItemFeedbackRepository;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.MinutesRepository;
import vn.acme.paperless_meeting.repository.OpinionRepository;
import vn.acme.paperless_meeting.repository.SpeakerTurnRepository;

/**
 * Dựng lát dữ liệu "Biên bản - Ý kiến" cho Agent Biên bản-Ý kiến: nội dung biên bản,
 * ý kiến đóng góp, lượt phát biểu theo từng nội dung, và góp ý/hướng dẫn chỉnh sửa
 * agenda item (AgendaItemFeedback). Có kèm trạng thái cuộc họp (<cuoc_hop>) để agent
 * biết cuộc họp đã diễn ra hay chưa - biên bản/ý kiến/phát biểu chỉ phát sinh SAU khi
 * cuộc họp bắt đầu, nên danh sách trống ở cuộc họp chưa diễn ra cần giải thích đúng lý
 * do (chưa diễn ra), không chỉ nói "chưa có" một cách chung chung.
 */
@Component
@RequiredArgsConstructor
public class MinutesOpinionSlice {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final MeetingRepository meetingRepository;
    private final MinutesRepository minutesRepository;
    private final OpinionRepository opinionRepository;
    private final SpeakerTurnRepository speakerTurnRepository;
    private final AgendaItemRepository agendaItemRepository;
    private final AgendaItemFeedbackRepository agendaItemFeedbackRepository;

    public String build(UUID meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
        List<AgendaItem> agendaItems = agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meetingId);
        Map<UUID, AgendaItem> agendaItemsById = agendaItems.stream()
                .collect(Collectors.toMap(AgendaItem::getId, item -> item));

        StringBuilder sb = new StringBuilder();
        sb.append("<cuoc_hop trang_thai=\"").append(meeting.getStatus() != null ? meeting.getStatus().getDescription() : "-")
                .append("\">Trạng thái này cho biết cuộc họp đã diễn ra hay chưa - biên bản/ý kiến/phát biểu chỉ "
                        + "có thể phát sinh SAU KHI cuộc họp đã bắt đầu (trạng thái \"Đang tiến hành\" hoặc \"Đã kết "
                        + "thúc\").</cuoc_hop>\n");
        appendMinutes(sb, meetingId);
        appendOpinions(sb, meetingId);
        appendSpeakerTurns(sb, meetingId);
        appendAgendaFeedback(sb, agendaItems, agendaItemsById);
        return sb.toString();
    }

    private void appendMinutes(StringBuilder sb, UUID meetingId) {
        List<Minutes> minutesList = minutesRepository.findByMeetingIdOrderByVersionNoDesc(meetingId);
        sb.append("<danh_sach_bien_ban>\n");
        for (Minutes m : minutesList) {
            sb.append("  <bien_ban")
                    .append(" phien_ban=\"").append(m.getVersionNo() != null ? m.getVersionNo() : 1).append("\"")
                    .append(" trang_thai=\"").append(m.getStatus() != null ? m.getStatus().getDescription() : "-").append("\"")
                    .append(" thoi_gian_chot=\"").append(m.getFinalizedAt() != null ? m.getFinalizedAt().format(DT_FMT) : "-").append("\"")
                    .append(">").append(safe(m.getContent())).append("</bien_ban>\n");
        }
        sb.append("</danh_sach_bien_ban>\n");
    }

    private void appendOpinions(StringBuilder sb, UUID meetingId) {
        List<Opinion> opinions = opinionRepository.findByMeetingIdWithUserAndAttachments(meetingId);
        sb.append("<danh_sach_y_kien>\n");
        for (Opinion o : opinions) {
            String nguoi = o.getUser() != null ? o.getUser().getFullName() + " (Đại biểu)"
                    : safe(o.getGuestName()) + " (Khách mời)";
            String tailieu = o.getAttachments() != null && !o.getAttachments().isEmpty()
                    ? o.getAttachments().stream().map(d -> safe(d.getTitle())).collect(Collectors.joining(", "))
                    : "-";
            sb.append("  <y_kien")
                    .append(" nguoi=\"").append(nguoi).append("\"")
                    .append(" thoi_gian=\"").append(o.getCreatedAt() != null ? o.getCreatedAt().format(DT_FMT) : "-").append("\"")
                    .append(" tai_lieu_dinh_kem=\"").append(tailieu).append("\"")
                    .append(">").append(safe(o.getOpinionDetail())).append("</y_kien>\n");
        }
        sb.append("</danh_sach_y_kien>\n");
    }

    private void appendSpeakerTurns(StringBuilder sb, UUID meetingId) {
        List<SpeakerTurn> turns = speakerTurnRepository.findByMeetingIdWithDetails(meetingId);
        sb.append("<danh_sach_phat_bieu>\n");
        for (SpeakerTurn t : turns) {
            String nguoi = t.getUser() != null ? t.getUser().getFullName()
                    : (t.getGuest() != null ? t.getGuest().getFullName() + " (Khách mời)" : "-");
            AgendaItem item = t.getAgendaItem();
            String thuocNoiDung = item != null ? "Nội dung " + item.getOrderNo() + ": " + item.getTitle() : "-";
            sb.append("  <phat_bieu")
                    .append(" nguoi=\"").append(safe(nguoi)).append("\"")
                    .append(" thuoc_noi_dung=\"").append(safe(thuocNoiDung)).append("\"")
                    .append(" bat_dau=\"").append(t.getStartAt() != null ? t.getStartAt().format(DT_FMT) : "-").append("\"")
                    .append(" ket_thuc=\"").append(t.getEndAt() != null ? t.getEndAt().format(DT_FMT) : "Đang phát biểu").append("\"")
                    .append("/>\n");
        }
        sb.append("</danh_sach_phat_bieu>\n");
    }

    // Đặt tên thẻ KHÔNG dùng chữ "góp ý"/"ý kiến" (trùng từ vựng với <danh_sach_y_kien> ở
    // trên, khiến model dễ lẫn 2 khái niệm khác nhau): đây là kênh trao đổi công việc
    // CHUẨN BỊ TÀI LIỆU giữa người giao việc và người chuẩn bị cho 1 nội dung cụ thể,
    // KHÔNG PHẢI ý kiến đóng góp tại phiên họp.
    private void appendAgendaFeedback(StringBuilder sb, List<AgendaItem> agendaItems, Map<UUID, AgendaItem> agendaItemsById) {
        List<UUID> agendaIds = agendaItems.stream().map(AgendaItem::getId).collect(Collectors.toList());
        List<AgendaItemFeedback> feedbacks = agendaIds.isEmpty() ? List.of()
                : agendaItemFeedbackRepository.findByAgendaItemIdInWithAuthor(agendaIds);

        sb.append("<danh_sach_trao_doi_chuan_bi_tai_lieu>\n");
        for (AgendaItemFeedback fb : feedbacks) {
            AgendaItem item = fb.getAgendaItem() != null ? agendaItemsById.get(fb.getAgendaItem().getId()) : null;
            String thuocNoiDung = item != null ? "Nội dung " + item.getOrderNo() + ": " + item.getTitle() : "-";
            String loai = "REJECTION".equalsIgnoreCase(fb.getType()) ? "Từ chối duyệt tài liệu"
                    : "INSTRUCTION".equalsIgnoreCase(fb.getType()) ? "Hướng dẫn chuẩn bị tài liệu"
                    : "RESPONSE".equalsIgnoreCase(fb.getType()) ? "Phản hồi của người chuẩn bị"
                    : fb.getType();
            sb.append("  <trao_doi")
                    .append(" thuoc_noi_dung=\"").append(safe(thuocNoiDung)).append("\"")
                    .append(" nguoi=\"").append(fb.getAuthor() != null ? safe(fb.getAuthor().getFullName()) : "-").append("\"")
                    .append(" loai=\"").append(loai != null ? loai : "-").append("\"")
                    .append(">").append(safe(fb.getContent())).append("</trao_doi>\n");
        }
        sb.append("</danh_sach_trao_doi_chuan_bi_tai_lieu>\n");
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\"", "'");
    }
}
