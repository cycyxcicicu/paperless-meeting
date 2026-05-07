package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;

@Getter
@Setter
public class UpdateInviteStatusRequest {
    @NotNull(message = "INVITE_STATUS_REQUIRED")
    private InviteStatus inviteStatus;
}
