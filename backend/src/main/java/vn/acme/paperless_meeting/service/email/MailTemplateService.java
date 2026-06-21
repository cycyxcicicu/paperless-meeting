package vn.acme.paperless_meeting.service.email;

import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class MailTemplateService {
    private final TemplateEngine templateEngine;

    public String renderMeetingInvitationHtml(Meeting meeting, User invitee, String invitationContent) {
        return renderMeetingInvitationHtml(meeting, invitee, invitationContent, null);
    }

    public String renderMeetingInvitationHtml(Meeting meeting, User invitee, String invitationContent, String confirmUrl) {
        Context context = new Context();
        context.setVariable("inviteeName", invitee.getFullName());
        context.setVariable("inviteePosition", invitee.getPosition() != null ? invitee.getPosition().getPositionName() : "Đại biểu");
        context.setVariable("meetingTitle", meeting.getTitle());
        
        String timeStr = meeting.getStartTime() != null 
                ? meeting.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm, 'ngày' dd/MM/yyyy"))
                : "[Thời gian cuộc họp]";
        context.setVariable("meetingTime", timeStr);
        
        String locationStr = meeting.getLocation() != null ? meeting.getLocation().getName() : "[Địa điểm cuộc họp]";
        context.setVariable("meetingLocation", locationStr);
        
        String formattedContent = invitationContent != null 
                ? org.jsoup.Jsoup.clean(invitationContent, org.jsoup.safety.Safelist.simpleText()).replace("\n", "<br/>") 
                : "";
        context.setVariable("invitationContent", formattedContent);
        context.setVariable("confirmUrl", confirmUrl);

        return templateEngine.process("email/meeting-invitation", context);
    }

    public String renderMeetingInvitationHtml(Meeting meeting, MeetingGuest guest, String invitationContent, String confirmUrl) {
        Context context = new Context();
        context.setVariable("inviteeName", guest.getFullName());
        context.setVariable("inviteePosition", guest.getPosition() != null && !guest.getPosition().isBlank() ? guest.getPosition() : "Khách mời");
        context.setVariable("meetingTitle", meeting.getTitle());
        
        String timeStr = meeting.getStartTime() != null 
                ? meeting.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm, 'ngày' dd/MM/yyyy"))
                : "[Thời gian cuộc họp]";
        context.setVariable("meetingTime", timeStr);
        
        String locationStr = meeting.getLocation() != null ? meeting.getLocation().getName() : "[Địa điểm cuộc họp]";
        context.setVariable("meetingLocation", locationStr);
        
        String formattedContent = invitationContent != null 
                ? org.jsoup.Jsoup.clean(invitationContent, org.jsoup.safety.Safelist.simpleText()).replace("\n", "<br/>") 
                : "";
        context.setVariable("invitationContent", formattedContent);
        context.setVariable("confirmUrl", confirmUrl);

        return templateEngine.process("email/meeting-invitation", context);
    }

    public String renderMeetingJoinDetailsHtml(Meeting meeting, User invitee, String joinUrl) {
        Context context = new Context();
        context.setVariable("inviteeName", invitee.getFullName());
        context.setVariable("meetingTitle", meeting.getTitle());
        
        String timeStr = meeting.getStartTime() != null 
                ? meeting.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm, 'ngày' dd/MM/yyyy"))
                : "[Thời gian cuộc họp]";
        context.setVariable("meetingTime", timeStr);
        context.setVariable("joinUrl", joinUrl);

        return templateEngine.process("email/meeting-join-details", context);
    }

    public String renderMeetingJoinDetailsHtml(Meeting meeting, MeetingGuest guest, String joinUrl) {
        Context context = new Context();
        context.setVariable("inviteeName", guest.getFullName());
        context.setVariable("meetingTitle", meeting.getTitle());
        
        String timeStr = meeting.getStartTime() != null 
                ? meeting.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm, 'ngày' dd/MM/yyyy"))
                : "[Thời gian cuộc họp]";
        context.setVariable("meetingTime", timeStr);
        context.setVariable("joinUrl", joinUrl);

        return templateEngine.process("email/meeting-join-details", context);
    }

    public String renderRsvpSuccessHtml() {
        Context context = new Context();
        return templateEngine.process("email/rsvp-success", context);
    }

    public String renderRsvpErrorHtml(String errorMessage) {
        Context context = new Context();
        context.setVariable("errorMessage", errorMessage);
        return templateEngine.process("email/rsvp-error", context);
    }
}
