package vn.acme.paperless_meeting.dto.response.meetingparticipant;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.SendStatus;

import java.util.Set;

@Getter
@Setter
@Builder
public class ParticipantResponse {
    private UUID id;
    private UUID meetingId;
    private UUID userId;
    private String username;
    private String fullName;
    private String email;
    private ParticipantRole participantRole;
    private InviteStatus inviteStatus;
    private AttendanceStatus attendanceStatus;
    private SendStatus sendStatus;
    private String note;
    private String deptName;
    private String positionName;
    private String declineReason;
    private UUID substituteUserId;
    private String substituteUserFullName;
    private String substituteName;
    private String substitutePosition;
    private String substituteCompany;
    private String substituteDepartment;
    private String substituteEmail;
    private String substitutePhone;
    private String substitutedForUserName;
    private String substitutedForUserPosition;
    private Boolean isFullSession;
    private Set<UUID> absentAgendaItemIds;
    private Set<String> absentAgendaItemTitles;
    private Boolean isSubstitute;
    private UUID substituteForParticipantId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
