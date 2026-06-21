package vn.acme.paperless_meeting.listener;

// Force compile: Added email send status mapping
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.config.RabbitMqConfig;
import vn.acme.paperless_meeting.service.email.InvitationMailService;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.enums.SendStatus;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MeetingInvitationRabbitListener {
    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final MeetingGuestRepository meetingGuestRepository;
    private final InvitationMailService invitationMailService;

    @Value("${app.urls.backend}")
    private String backendUrl;

    @RabbitListener(queues = RabbitMqConfig.INVITATION_QUEUE)
    @Transactional
    public void processMeetingInvitation(String meetingIdStr) {
        log.info("Lắng nghe RabbitMQ nhận được tin nhắn cho meetingId: {}", meetingIdStr);
        try {
            UUID meetingId = UUID.fromString(meetingIdStr);
            Meeting meeting = meetingRepository.findById(meetingId).orElse(null);
            if (meeting == null) {
                log.warn("Không tìm thấy cuộc họp có id: {} trong cơ sở dữ liệu", meetingId);
                return;
            }

            if (meeting.getRequiresInvitation() != null && !meeting.getRequiresInvitation()) {
                log.info("Cuộc họp {} không đính kèm file giấy mời PDF, chỉ gửi email thông báo họp.", meetingId);
            }

            sendInvitationsToParticipants(meeting);
            sendInvitationsToGuests(meeting);

        } catch (Exception e) {
            log.error("Lỗi khi xử lý thư mời cuộc họp từ hàng đợi RabbitMQ cho tin nhắn: {}", meetingIdStr, e);
        }
    }

    private void sendInvitationsToParticipants(Meeting meeting) {
        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meeting.getId());
        if (participants == null) return;

        for (MeetingParticipant p : participants) {
            if (p.getUser() != null && p.getUser().getEmail() != null && !p.getUser().getEmail().isBlank()) {
                // Bỏ qua không gửi mail cho người tạo cuộc họp
                if (meeting.getCreatedBy() != null && p.getUser().getId().equals(meeting.getCreatedBy().getId())) {
                    log.info("Bỏ qua gửi email thư mời cho người tạo cuộc họp: {}", p.getUser().getEmail());
                    p.setSendStatus(SendStatus.SENT);
                    meetingParticipantRepository.save(p);
                    continue;
                }
                try {
                    // Đại biểu trong đơn vị chỉ nhận thông tin thư mời mà không có nút xác nhận trực tiếp từ email (họ sẽ xác nhận trên web)
                    invitationMailService.sendMeetingInvitation(meeting, p.getUser(), meeting.getInvitationContent(), null);
                    p.setSendStatus(SendStatus.SENT);
                } catch (Exception e) {
                    p.setSendStatus(SendStatus.FAILED);
                    log.error("Gửi email thư mời thất bại tới đại biểu: {} ({})", p.getUser().getFullName(), p.getUser().getEmail(), e);
                }
                meetingParticipantRepository.save(p);
            }
        }
    }

    private void sendInvitationsToGuests(Meeting meeting) {
        List<MeetingGuest> guests = meetingGuestRepository.findByMeetingId(meeting.getId());
        if (guests == null) return;

        for (MeetingGuest g : guests) {
            if (g.getEmail() != null && !g.getEmail().isBlank()) {
                try {
                    // Khách ngoài cần nút bấm xác nhận RSVP qua email
                    String confirmUrl = backendUrl + "/meetings/public/rsvp/confirm?rsvpToken=" + g.getRsvpToken();
                    invitationMailService.sendGuestMeetingInvitation(meeting, g, meeting.getInvitationContent(), confirmUrl);
                    g.setSendStatus(SendStatus.SENT);
                } catch (Exception e) {
                    g.setSendStatus(SendStatus.FAILED);
                    log.error("Gửi email thư mời thất bại tới khách mời: {} ({})", g.getFullName(), g.getEmail(), e);
                }
                meetingGuestRepository.save(g);
            }
        }
    }
}
