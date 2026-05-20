package vn.acme.paperless_meeting.dto.request.speaker;

import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StartDirectTurnRequest {
    private UUID userId;
    private Integer minutes;
}
