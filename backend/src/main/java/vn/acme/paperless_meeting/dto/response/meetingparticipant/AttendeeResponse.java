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
public class AttendeeResponse {
    private UUID id;
    private String type; // "INTERNAL" or "EXTERNAL"
    private UUID userId;
    private UUID guestId;
    private String fullName;
    private String email;
    private String phone;
    private String company;
    private String position;
    private ParticipantRole role;
    private InviteStatus inviteStatus;
    private AttendanceStatus attendanceStatus;
    private String note;
    private String declineReason;
    private UUID substituteUserId;
    private String substituteUserFullName;
    private String substituteName;
    private String substitutePosition;
    private String substituteCompany;
    private String substituteDepartment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
