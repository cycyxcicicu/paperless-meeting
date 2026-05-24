package vn.acme.paperless_meeting.dto.request.user;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

@Getter
@Setter
public class UserCreateRequest {
    @NotBlank(message = "USERNAME_REQUIRED")
    @Size(min = 3, max = 50, message = "NAME_INVALID")
    private String username;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(min = 8, message = "PASSWORD_INVALID")
    private String password;

    @NotBlank(message = "USER_FULLNAME_REQUIRED")
    @Size(min = 3, max = 100, message = "NAME_INVALID")
    private String fullName;

    @NotBlank(message = "USER_EMAIL_REQUIRED")
    @Email(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "USER_EMAIL_INVALID")
    private String email;

    @NotBlank(message = "USER_PHONE_REQUIRED")
    private String phone;

    @NotNull(message = "USER_STATUS_REQUIRED")
    private UserStatus status;

    private UUID positionId;

    @NotNull(message = "DEPARTMENT_ID_REQUIRED")
    private UUID departmentId;

    @NotNull(message = "ROLE_ID_REQUIRED")
    private UUID roleId;

    private String avatar;
}
