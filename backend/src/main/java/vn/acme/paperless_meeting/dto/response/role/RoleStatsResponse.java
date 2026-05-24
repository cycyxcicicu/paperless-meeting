package vn.acme.paperless_meeting.dto.response.role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleStatsResponse {
    private long totalRoles;
    private long activeRoles;
    private long usersWithoutRole;
}
