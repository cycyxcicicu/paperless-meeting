package vn.acme.paperless_meeting.dto.response.motion;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class VoteOptionResponse {
    private UUID id;
    private String label;
    private Integer orderNo;
}
