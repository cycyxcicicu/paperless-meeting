package vn.acme.paperless_meeting.dto.response.user;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

@Getter
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private UserStatus status;
    private String avatar;
    private LocalDateTime createdAt;
}
