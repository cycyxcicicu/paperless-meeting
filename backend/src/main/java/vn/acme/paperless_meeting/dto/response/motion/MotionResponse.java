package vn.acme.paperless_meeting.dto.response.motion;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.MotionStatus;

@Getter
@Setter
@Builder
public class MotionResponse {
    private UUID id;
    private String title;
    private String description;
    private MotionStatus status;
    private UUID agendaItemId;
    private UUID meetingId;
    private UUID createdByUserId;
    private String createdByFullName;
}
