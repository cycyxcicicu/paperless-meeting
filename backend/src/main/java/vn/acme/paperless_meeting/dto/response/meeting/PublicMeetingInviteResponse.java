package vn.acme.paperless_meeting.dto.response.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicMeetingInviteResponse {
    private UUID meetingId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String inviterName;
    private String deptName;
}
