package vn.acme.paperless_meeting.dto.request.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

@Getter
@Setter
public class UserUpdateRequest {
    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 3, max = 50, message = "NAME_INVALID")
    private String username;

    @NotBlank(message = "USER_FULLNAME_REQUIRED")
    @Size(min = 3, max = 100, message = "NAME_INVALID")
    private String fullName;

    @Size(min = 8, message = "PASSWORD_INVALID")
    private String passwordHash;

    @Email(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "USER_EMAIL_INVALID")
    @NotBlank(message = "USER_EMAIL_REQUIRED")
    private String email;

    @NotBlank(message = "USER_PHONE_REQUIRED")
    private String phone;

    @NotNull(message = "USER_STATUS_REQUIRED")
    private UserStatus status;

    private String avatar;
}
