package vn.acme.paperless_meeting.dto.request.permission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PermissionUpsertRequest {
    @NotBlank(message = "PERMISSION_CODE_REQUIRED")
    @Size(min = 2, max = 100, message = "INVALID_KEY")
    private String permCode;

    @Size(max = 255, message = "INVALID_KEY")
    private String description;
}
