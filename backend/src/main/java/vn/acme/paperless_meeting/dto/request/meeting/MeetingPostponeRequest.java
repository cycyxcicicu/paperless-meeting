package vn.acme.paperless_meeting.dto.request.meeting;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MeetingPostponeRequest {
    @NotNull(message = "Thời gian bắt đầu mới không được để trống")
    private LocalDateTime newStartTime;

    @NotNull(message = "Thời gian kết thúc mới không được để trống")
    private LocalDateTime newEndTime;

    private String reason;
}
