package vn.acme.paperless_meeting.service.email;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.service.meeting.MeetingService;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingInvitationPreviewRequest;

import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationMailService {
    private final SmtpEmailService smtpEmailService;
    private final MailTemplateService mailTemplateService;
    private final MeetingService meetingService;

    public void sendMeetingInvitation(Meeting meeting, User invitee, String invitationContent) {
        sendMeetingInvitation(meeting, invitee, invitationContent, null);
    }

    public void sendMeetingInvitation(Meeting meeting, User invitee, String invitationContent, String confirmUrl) {
        if (invitee.getEmail() == null || invitee.getEmail().isBlank()) {
            return;
        }

        String subject = "THƯ MỜI: " + meeting.getTitle();
        String htmlContent = mailTemplateService.renderMeetingInvitationHtml(meeting, invitee, invitationContent, confirmUrl);

        byte[] pdfBytes = null;
        if (meeting.getId() != null && Boolean.TRUE.equals(meeting.getRequiresInvitation())) {
            try {
                MeetingInvitationPreviewRequest pdfRequest = new MeetingInvitationPreviewRequest();
                pdfRequest.setInvitationTemplateId(meeting.getInvitationTemplateId());
                pdfRequest.setInvitationContent(meeting.getInvitationContent());
                pdfRequest.setInviteeId(invitee.getId());
                pdfRequest.setInviteeType("USER");
                pdfBytes = meetingService.exportInvitationPdf(meeting.getId(), pdfRequest);
            } catch (Exception e) {
                log.warn("Tạo PDF thư mời họp thất bại cho người dùng {}: {}", invitee.getEmail(), e.getMessage());
            }
        }

        if (pdfBytes != null) {
            try {
                String base64Content = Base64.getEncoder().encodeToString(pdfBytes);
                smtpEmailService.sendHtmlEmailWithAttachment(
                    invitee.getEmail(), 
                    subject, 
                    htmlContent, 
                    "Giay_Moi_Hop.pdf", 
                    base64Content
                );
                return;
            } catch (Exception e) {
                log.error("Gửi email đính kèm thất bại tới: {}, tự động chuyển hướng gửi không đính kèm", invitee.getEmail(), e);
            }
        }

        // Fallback to sending plain HTML email without attachment
        smtpEmailService.sendHtmlEmail(invitee.getEmail(), subject, htmlContent);
    }

    @Async
    public void sendMeetingJoinLink(Meeting meeting, User invitee, String joinUrl) {
        if (invitee.getEmail() == null || invitee.getEmail().isBlank()) {
            return;
        }

        String subject = "ĐƯỜNG DẪN THAM GIA HỌP: " + meeting.getTitle();
        String htmlContent = mailTemplateService.renderMeetingJoinDetailsHtml(meeting, invitee, joinUrl);
        smtpEmailService.sendHtmlEmail(invitee.getEmail(), subject, htmlContent);
    }

    public void sendGuestMeetingInvitation(Meeting meeting, MeetingGuest guest, String invitationContent, String confirmUrl) {
        if (guest.getEmail() == null || guest.getEmail().isBlank()) {
            return;
        }

        String subject = "THƯ MỜI HỌP: " + meeting.getTitle();
        String htmlContent = mailTemplateService.renderMeetingInvitationHtml(meeting, guest, invitationContent, confirmUrl);

        byte[] pdfBytes = null;
        if (meeting.getId() != null && Boolean.TRUE.equals(meeting.getRequiresInvitation())) {
            try {
                MeetingInvitationPreviewRequest pdfRequest = new MeetingInvitationPreviewRequest();
                pdfRequest.setInvitationTemplateId(meeting.getInvitationTemplateId());
                pdfRequest.setInvitationContent(meeting.getInvitationContent());
                pdfRequest.setInviteeId(guest.getId());
                pdfRequest.setInviteeType("GUEST");
                pdfBytes = meetingService.exportInvitationPdf(meeting.getId(), pdfRequest);
            } catch (Exception e) {
                log.warn("Tạo PDF thư mời họp thất bại cho khách mời {}: {}", guest.getEmail(), e.getMessage());
            }
        }

        if (pdfBytes != null) {
            try {
                String base64Content = Base64.getEncoder().encodeToString(pdfBytes);
                smtpEmailService.sendHtmlEmailWithAttachment(
                    guest.getEmail(), 
                    subject, 
                    htmlContent, 
                    "Giay_Moi_Hop.pdf", 
                    base64Content
                );
                return;
            } catch (Exception e) {
                log.error("Gửi email đính kèm thất bại tới khách mời: {}, tự động chuyển hướng gửi không đính kèm", guest.getEmail(), e);
            }
        }

        smtpEmailService.sendHtmlEmail(guest.getEmail(), subject, htmlContent);
    }

    @Async
    public void sendGuestMeetingJoinLink(Meeting meeting, MeetingGuest guest, String joinUrl) {
        if (guest.getEmail() == null || guest.getEmail().isBlank()) {
            return;
        }

        String subject = "ĐƯỜNG DẪN THAM GIA HỌP: " + meeting.getTitle();
        String htmlContent = mailTemplateService.renderMeetingJoinDetailsHtml(meeting, guest, joinUrl);
        smtpEmailService.sendHtmlEmail(guest.getEmail(), subject, htmlContent);
    }
}
