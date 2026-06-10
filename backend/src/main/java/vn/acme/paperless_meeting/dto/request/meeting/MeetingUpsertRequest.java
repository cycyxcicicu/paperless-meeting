package vn.acme.paperless_meeting.dto.request.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.MeetingFile;

@Getter
@Setter
public class MeetingUpsertRequest {
    @NotBlank(message = "MEETING_TITLE_REQUIRED")
    @Size(max = 255, message = "MEETING_TITLE_INVALID")
    private String title;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime rsvpDeadline;
    private String content;
    private String onlineLink;
    private Integer lateAfterMinutes;
    private UUID locationId;

    @NotNull(message = "DEPARTMENT_ID_REQUIRED")
    private UUID departmentId;

    private MeetingFile agendaFile;
}
