package vn.acme.paperless_meeting.dto.request.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeetingScheduleRequest {
    // make fields optional so schedule() can fall back to draft values
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime checkinOpenAt;
    private LocalDateTime checkinCloseAt;
    private Integer lateAfterMinutes;

    private UUID locationId;
}
