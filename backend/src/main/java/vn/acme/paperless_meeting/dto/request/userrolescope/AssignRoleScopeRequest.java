package vn.acme.paperless_meeting.dto.request.userrolescope;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AssignRoleScopeRequest {
    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Role ID is required")
    private UUID roleId;

    @NotNull(message = "Scope ID is required")
    private UUID scopeId;
}
