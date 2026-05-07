package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;

@Getter
@Setter
public class AddParticipantRequest {
    @NotNull(message = "USER_ID_REQUIRED")
    private UUID userId;

    @NotNull(message = "PARTICIPANT_ROLE_REQUIRED")
    private ParticipantRole participantRole;

    private InviteStatus inviteStatus;

    private AttendanceStatus attendanceStatus;

    private String note;
}
