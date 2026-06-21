package vn.acme.paperless_meeting.dto.request.meeting;

import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeetingInvitationUpdateRequest {
    private Boolean requiresInvitation;
    private UUID invitationTemplateId;
    private String invitationContent;
}
