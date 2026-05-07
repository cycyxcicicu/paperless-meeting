package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;

@Getter
@Setter
public class UpdateParticipantRoleRequest {
    @NotNull(message = "PARTICIPANT_ROLE_REQUIRED")
    private ParticipantRole participantRole;
}
