package vn.acme.paperless_meeting.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    @Size(min = 3, message = "NAME_INVALID")
    String username;

    @Size(min = 8, message = "PASSWORD_INVALID")
    String passwordHash;

    @NotBlank
    String fullName;

    @NotBlank
    @Email(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Invalid email format")
    String email;

    @NotBlank
    String phone;

    @NotNull(message = "STATUS_REQUIRED")
    UserStatus status;

    String avatar;
}
