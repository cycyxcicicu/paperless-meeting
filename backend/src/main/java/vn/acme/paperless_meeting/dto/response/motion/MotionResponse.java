package vn.acme.paperless_meeting.dto.response.motion;

import java.util.UUID;
import java.util.List;
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
    private String agendaItemTitle;
    private Boolean hasVoted;
    private UUID meetingId;
    private UUID createdByUserId;
    private String createdByFullName;
    private List<VoteOptionResponse> options;
    private Integer durationMinutes;
    private Long timeLeftSeconds;
}

