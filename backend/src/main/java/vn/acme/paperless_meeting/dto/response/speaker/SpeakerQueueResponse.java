package vn.acme.paperless_meeting.dto.response.speaker;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueuePriority;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueueStatus;

@Getter
@Setter
@Builder
public class SpeakerQueueResponse {
    private UUID id;
    private LocalDateTime requestedAt;
    private SpeakerQueuePriority priority;
    private Integer sortOrder;
    private SpeakerQueueStatus queueStatus;
    
    private UUID userId;
    private String userName;
    private String avatarUrl;
    private String position;
    private UUID meetingId;
    private UUID guestId;
    private Boolean isGuestSubstitute;
    private UUID activeTurnId;
    private LocalDateTime speakingStartAt;
    private Long speakingDurationSeconds;
}
