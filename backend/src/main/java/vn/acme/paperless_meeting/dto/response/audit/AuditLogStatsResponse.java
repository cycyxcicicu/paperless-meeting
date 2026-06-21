package vn.acme.paperless_meeting.dto.response.audit;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AuditLogStatsResponse {
    private long totalLogs;
    private long todayLogs;
    private long criticalActions;
    private long activeUsers;
}
