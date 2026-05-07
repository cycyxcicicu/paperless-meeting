package vn.acme.paperless_meeting.dto.request.meeting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeetingCancelRequest {
    @NotBlank(message = "MEETING_CANCEL_REASON_REQUIRED")
    @Size(max = 1000, message = "MEETING_CANCEL_REASON_INVALID")
    private String cancelReason;
}
