package vn.acme.paperless_meeting.dto.response.department;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DepartmentStatsResponse {
    private long totalUnits;
    private long activeUnits;
}
