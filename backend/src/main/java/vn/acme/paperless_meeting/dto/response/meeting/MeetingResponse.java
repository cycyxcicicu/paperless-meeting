package vn.acme.paperless_meeting.dto.response.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.MeetingFile;

@Getter
@Setter
@Builder
public class MeetingResponse {
    private MeetingFile agendaFile;
    private UUID id;
    private String title;
    private MeetingStatus status;
    private UUID approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectReason;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime rsvpDeadline;
    private String content;
    private String onlineLink;
    private Integer lateAfterMinutes;
    private LocalDateTime createdAt;
    private String cancelReason;
    private UUID locationId;
    private String locationName;
    private UUID departmentId;
    private String departmentName;
    private UUID createdById;
    private String createdByName;
    private String callerRole;
    private InviteStatus callerInviteStatus;
    private String chairName;
    
    private Integer participantsCount;
    private Integer documentsCount;
    private Boolean canEdit;
    private Boolean canCancel;
    private Boolean canPublish;
    private Boolean canPostpone;
    private Boolean canDelete;
    private Boolean canSubmitApproval;
    private Boolean canUploadDocs;
}
