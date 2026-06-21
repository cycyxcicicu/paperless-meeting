package vn.acme.paperless_meeting.dto.request.meeting;

import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeetingInvitationPreviewRequest {
    private UUID invitationTemplateId;
    private String invitationContent;
    private UUID inviteeId;
    private String inviteeType; // "USER" or "GUEST"
}
