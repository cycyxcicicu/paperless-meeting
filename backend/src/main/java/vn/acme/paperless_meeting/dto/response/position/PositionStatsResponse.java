package vn.acme.paperless_meeting.dto.response.position;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PositionStatsResponse {
    private long totalPositions;
    private long totalUsers;
}
