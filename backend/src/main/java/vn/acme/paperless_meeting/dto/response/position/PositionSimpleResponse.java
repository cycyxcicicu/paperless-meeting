package vn.acme.paperless_meeting.dto.response.position;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PositionSimpleResponse {
    private UUID id;
    private String positionName;
    private String positionCode;
    private Integer rankOrder;
    private Boolean isLeadership;
}
