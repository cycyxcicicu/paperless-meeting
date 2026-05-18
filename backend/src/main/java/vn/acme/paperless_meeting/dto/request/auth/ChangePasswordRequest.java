package vn.acme.paperless_meeting.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    @NotBlank(message = "OLD_PASSWORD_REQUIRED")
    private String oldPassword;

    @NotBlank(message = "NEW_PASSWORD_REQUIRED")
    @Size(min = 8, message = "PASSWORD_INVALID")
    private String newPassword;
}
