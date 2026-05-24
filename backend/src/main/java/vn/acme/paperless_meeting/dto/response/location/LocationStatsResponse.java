package vn.acme.paperless_meeting.dto.response.location;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationStatsResponse {
    private long totalLocations;
    private long activeLocations;
    private long totalCapacity;
}
