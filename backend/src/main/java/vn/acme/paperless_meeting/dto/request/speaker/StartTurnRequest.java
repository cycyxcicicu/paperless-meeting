package vn.acme.paperless_meeting.dto.request.speaker;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StartTurnRequest {
    private Integer minutes;
}
