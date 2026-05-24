package vn.acme.paperless_meeting.dto.response.user;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserStatsResponse {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
}
