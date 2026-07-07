package vn.acme.paperless_meeting.service.assistant.context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.AttendanceLog;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.SpeakerTurn;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.AttendanceLogRepository;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.SpeakerTurnRepository;

/**
 * Dựng lát dữ liệu "Thông tin họp" cho Agent Thông tin họp: thông tin chung, chương
 * trình họp, thành phần tham dự (đến muộn/vắng/khách mời/đã-chưa phát biểu). Mọi
 * trường suy diễn được tính sẵn ở đây theo Từ điển dữ liệu (mục 6 của kế hoạch) - AI
 * chỉ đọc, không tự luận.
 */
@Component
@RequiredArgsConstructor
public class MeetingInfoSlice {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final MeetingRepository meetingRepository;
    private final AgendaItemRepository agendaItemRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final MeetingGuestRepository meetingGuestRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final SpeakerTurnRepository speakerTurnRepository;

    public String build(UUID meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        List<AgendaItem> agendaItems = agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meetingId);
        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
        List<MeetingGuest> guests = meetingGuestRepository.findByMeetingId(meetingId);
        List<AttendanceLog> attendanceLogs = attendanceLogRepository.findByMeetingId(meetingId);
        List<SpeakerTurn> speakerTurns = speakerTurnRepository.findByMeetingIdWithDetails(meetingId);

        Set<UUID> spokenUserIds = new HashSet<>();
        Set<UUID> spokenGuestIds = new HashSet<>();
        for (SpeakerTurn turn : speakerTurns) {
            if (turn.getUser() != null) {
                spokenUserIds.add(turn.getUser().getId());
            }
            if (turn.getGuest() != null) {
                spokenGuestIds.add(turn.getGuest().getId());
            }
        }

        StringBuilder sb = new StringBuilder();
        appendMeetingHeader(sb, meeting);
        appendAgenda(sb, agendaItems);
        appendParticipants(sb, participants, guests, attendanceLogs, spokenUserIds, spokenGuestIds);
        return sb.toString();
    }

    private void appendMeetingHeader(StringBuilder sb, Meeting meeting) {
        sb.append("<cuoc_hop")
                .append(" ten=\"").append(safe(meeting.getTitle())).append("\"")
                .append(" dia_diem=\"").append(meeting.getLocation() != null ? safe(meeting.getLocation().getName()) : "Chưa xác định").append("\"")
                .append(" bat_dau=\"").append(formatDateTime(meeting.getStartTime())).append("\"")
                .append(" ket_thuc=\"").append(formatDateTime(meeting.getEndTime())).append("\"")
                .append(" trang_thai=\"").append(meeting.getStatus() != null ? meeting.getStatus().getDescription() : "-").append("\"")
                .append("/>\n");
    }

    private void appendAgenda(StringBuilder sb, List<AgendaItem> agendaItems) {
        sb.append("<danh_sach_noi_dung>\n");
        for (AgendaItem item : agendaItems) {
            sb.append("  <noi_dung")
                    .append(" thu_tu=\"").append(item.getOrderNo()).append("\"")
                    .append(" tieu_de=\"").append(safe(item.getTitle())).append("\"")
                    .append(" trang_thai=\"").append(item.getStatus() != null ? item.getStatus().getDescription() : "-").append("\"")
                    .append("/>\n");
        }
        sb.append("</danh_sach_noi_dung>\n");
    }

    private void appendParticipants(StringBuilder sb, List<MeetingParticipant> participants, List<MeetingGuest> guests,
            List<AttendanceLog> attendanceLogs, Set<UUID> spokenUserIds, Set<UUID> spokenGuestIds) {

        sb.append("<danh_sach_nguoi_tham_du>\n");

        for (MeetingParticipant p : participants) {
            User user = p.getUser();
            AttendanceLog log = attendanceLogs.stream()
                    .filter(a -> a.getUser() != null && user != null && a.getUser().getId().equals(user.getId()))
                    .findFirst().orElse(null);

            sb.append("  <nguoi_tham_du")
                    .append(" ho_ten=\"").append(user != null ? safe(user.getFullName()) : "-").append("\"")
                    .append(" chuc_vu=\"").append(user != null && user.getPosition() != null ? safe(user.getPosition().getPositionName()) : "-").append("\"")
                    .append(" don_vi=\"").append(user != null && user.getDepartment() != null ? safe(user.getDepartment().getDeptName()) : "-").append("\"")
                    .append(" vai_tro_trong_hop=\"").append(p.getParticipantRole() != null ? p.getParticipantRole().getDescription() : "-").append("\"")
                    .append(" loai=\"Thành viên chính thức\"")
                    .append(" trang_thai=\"").append(p.getAttendanceStatus() != null ? p.getAttendanceStatus().getDescription() : "-").append("\"")
                    .append(" gio_diem_danh=\"").append(log != null ? formatDateTime(log.getCheckinTime()) : "-").append("\"")
                    .append(" di_muon=\"").append(lateLabel(p.getAttendanceStatus(), log)).append("\"")
                    .append(" da_phat_bieu=\"").append(user != null && spokenUserIds.contains(user.getId()) ? "Đã phát biểu" : "Chưa phát biểu").append("\"")
                    .append("/>\n");
        }

        for (MeetingGuest guest : guests) {
            AttendanceLog log = attendanceLogs.stream()
                    .filter(a -> a.getGuest() != null && a.getGuest().getId().equals(guest.getId()))
                    .findFirst().orElse(null);

            sb.append("  <nguoi_tham_du")
                    .append(" ho_ten=\"").append(safe(guest.getFullName())).append("\"")
                    .append(" chuc_vu=\"").append(guest.getPosition() != null ? safe(guest.getPosition()) : "-").append("\"")
                    .append(" don_vi=\"").append(guest.getCompany() != null ? safe(guest.getCompany()) : "-").append("\"")
                    .append(" vai_tro_trong_hop=\"Khách mời\"")
                    .append(" loai=\"Khách mời\"")
                    .append(" trang_thai=\"").append(guest.getAttendanceStatus() != null ? guest.getAttendanceStatus().getDescription() : "-").append("\"")
                    .append(" gio_diem_danh=\"").append(log != null ? formatDateTime(log.getCheckinTime()) : "-").append("\"")
                    .append(" di_muon=\"").append(lateLabel(guest.getAttendanceStatus(), log)).append("\"")
                    .append(" da_phat_bieu=\"").append(spokenGuestIds.contains(guest.getId()) ? "Đã phát biểu" : "Chưa phát biểu").append("\"")
                    .append("/>\n");
        }

        sb.append("</danh_sach_nguoi_tham_du>\n");
    }

    private String lateLabel(AttendanceStatus status, AttendanceLog log) {
        if (status == AttendanceStatus.ABSENT || status == null || status == AttendanceStatus.NOT_CHECKED_IN) {
            return "-";
        }
        if (log != null && log.getLateMinutes() != null && log.getLateMinutes() > 0) {
            return "Đến muộn " + log.getLateMinutes() + " phút";
        }
        return "Đúng giờ";
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt != null ? dt.format(DT_FMT) : "-";
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\"", "'");
    }
}
