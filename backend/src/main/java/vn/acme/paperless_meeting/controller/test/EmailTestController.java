package vn.acme.paperless_meeting.controller.test;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.acme.paperless_meeting.config.RabbitMqConfig;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.email.InvitationMailService;
import vn.acme.paperless_meeting.service.email.SmtpEmailService;

@RestController
@RequestMapping("/test/email")
@RequiredArgsConstructor
@Slf4j
public class EmailTestController {

    private final SmtpEmailService smtpEmailService;
    private final InvitationMailService invitationMailService;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;

    @PostMapping("/send-direct")
    public ResponseEntity<ApiResponse<String>> sendDirect(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestBody String htmlContent) {
        log.info("Gọi endpoint kiểm thử send-direct tới: {}", to);
        smtpEmailService.sendHtmlEmail(to, subject, htmlContent);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi email thành công qua SMTP tới: " + to));
    }

    @PostMapping("/send-template")
    public ResponseEntity<ApiResponse<String>> sendTemplate(
            @RequestParam(required = false) String to,
            @RequestParam(required = false) UUID meetingId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String invitationContent) {
        log.info("Gọi endpoint kiểm thử send-template");

        Meeting meeting = null;
        if (meetingId != null) {
            meeting = meetingRepository.findById(meetingId).orElse(null);
        }
        if (meeting == null) {
            meeting = new Meeting();
            meeting.setTitle("Cuộc họp Thử nghiệm Hệ thống");
            meeting.setStartTime(LocalDateTime.now().plusDays(1));
            Location loc = new Location();
            loc.setName("Phòng họp số 3, Tầng 5");
            meeting.setLocation(loc);
        }

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null) {
            user = new User();
            user.setFullName("Nguyễn Văn A");
            user.setEmail(to != null ? to : "test@example.com");
            Position pos = new Position();
            pos.setPositionName("Giám đốc Công nghệ");
            user.setPosition(pos);
        } else if (to != null && !to.isBlank()) {
            user.setEmail(to);
        }

        String content = invitationContent != null ? invitationContent 
                : "Kính mời đồng chí tham dự cuộc họp để triển khai thử nghiệm hệ thống gửi mail.";

        invitationMailService.sendMeetingInvitation(meeting, user, content);
        return ResponseEntity.ok(ApiResponse.success("Đã xử lý và gửi email mẫu tới: " + user.getEmail()));
    }

    @PostMapping("/publish-event")
    public ResponseEntity<ApiResponse<String>> publishEvent(@RequestParam String meetingId) {
        log.info("Gọi endpoint kiểm thử publish-event tới RabbitMQ cho meetingId: {}", meetingId);
        rabbitTemplate.convertAndSend(
                RabbitMqConfig.MEETING_EXCHANGE,
                RabbitMqConfig.INVITATION_ROUTING_KEY,
                meetingId
        );
        return ResponseEntity.ok(ApiResponse.success("Tin nhắn đã được gửi thành công lên RabbitMQ Exchange cho ID cuộc họp: " + meetingId));
    }
}
