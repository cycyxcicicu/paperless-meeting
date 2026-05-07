package vn.acme.paperless_meeting.dto.response.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;

@Getter
@Builder
public class MeetingResponse {
    private UUID id;
    private String title;
    private String description;
    private MeetingStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime checkinOpenAt;
    private LocalDateTime checkinCloseAt;
    private Integer lateAfterMinutes;
    private LocalDateTime createdAt;
    private String cancelReason;
    private UUID locationId;
    private String locationName;
    private UUID departmentId;
    private String departmentName;
    private UUID createdById;
    private String createdByName;
}
