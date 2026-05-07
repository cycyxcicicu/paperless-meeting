package vn.acme.paperless_meeting.dto.request.role;

import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleUpsertRequest {
    @NotBlank(message = "ROLE_NAME_REQUIRED")
    @Size(min = 2, max = 100, message = "NAME_INVALID")
    private String roleName;
    
    // optional: permission codes to assign to this role
    private Set<String> permCodes;
}

