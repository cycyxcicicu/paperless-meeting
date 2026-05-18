package vn.acme.paperless_meeting.dto.response.role;

import java.util.Set;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoleResponse {
    private UUID id;
    private String roleCode;
    private String roleName;
    private Set<String> permCodes;
}
