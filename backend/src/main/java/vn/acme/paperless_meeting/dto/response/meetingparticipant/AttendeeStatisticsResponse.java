package vn.acme.paperless_meeting.dto.response.meetingparticipant;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendeeStatisticsResponse {
    private int totalAttendees;
    private int totalCheckedIn;
    private int totalPending;
    private int totalDeclined;
    private int totalAccepted;
}
