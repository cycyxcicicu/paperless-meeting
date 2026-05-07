package vn.acme.paperless_meeting.dto.response.meetingparticipant;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;

@Getter
@Builder
public class ParticipantResponse {
    private UUID meetingId;
    private UUID userId;
    private String username;
    private String fullName;
    private ParticipantRole participantRole;
    private InviteStatus inviteStatus;
    private AttendanceStatus attendanceStatus;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
