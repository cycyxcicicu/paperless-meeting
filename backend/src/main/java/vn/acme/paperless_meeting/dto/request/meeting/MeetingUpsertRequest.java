package vn.acme.paperless_meeting.dto.request.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeetingUpsertRequest {
    @NotBlank(message = "MEETING_TITLE_REQUIRED")
    @Size(max = 255, message = "MEETING_TITLE_INVALID")
    private String title;

    @Size(max = 5000, message = "MEETING_DESCRIPTION_INVALID")
    private String description;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime checkinOpenAt;
    private LocalDateTime checkinCloseAt;
    private Integer lateAfterMinutes;
    private UUID locationId;
    private UUID departmentId;
}
