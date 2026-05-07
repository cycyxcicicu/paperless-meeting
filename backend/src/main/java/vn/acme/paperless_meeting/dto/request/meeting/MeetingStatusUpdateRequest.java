package vn.acme.paperless_meeting.dto.request.meeting;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;

@Getter
@Setter
public class MeetingStatusUpdateRequest {
    @NotNull(message = "MEETING_STATUS_REQUIRED")
    private MeetingStatus status;

    @Size(max = 1000, message = "MEETING_CANCEL_REASON_INVALID")
    private String cancelReason;
}
