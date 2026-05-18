package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;

@Getter
@Setter
public class UpdateAttendanceStatusRequest {
    @NotNull(message = "ATTENDANCE_STATUS_REQUIRED")
    private AttendanceStatus attendanceStatus;

    private String note;
}
