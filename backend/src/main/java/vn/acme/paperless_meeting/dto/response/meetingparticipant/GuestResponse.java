package vn.acme.paperless_meeting.dto.response.meetingparticipant;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.SendStatus;

@Getter
@Setter
@Builder
public class GuestResponse {
    private UUID guestId;
    private UUID meetingId;
    private String fullName;
    private String gender;
    private String email;
    private String phone;
    private String company;
    private String position;
    private String description;
    private UUID rsvpToken;
    private UUID guestToken;
    private InviteStatus inviteStatus;
    private AttendanceStatus attendanceStatus;
    private SendStatus sendStatus;
    private String note;
    private String substitutedForUserName;
    private String substitutedForUserPosition;
    private Boolean isSubstitute;
    private UUID substituteForParticipantId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
