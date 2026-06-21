package vn.acme.paperless_meeting.dto.response.speaker;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class SpeakerTurnResponse {
    private UUID id;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Long durationSeconds;
    
    private UUID userId;
    private String userName;
    private String avatarUrl;
    private UUID meetingId;
    private UUID guestId;
    private Boolean isGuestSubstitute;
}
