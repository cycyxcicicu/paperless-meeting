package vn.acme.paperless_meeting.dto.response.user;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;


import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.dto.response.department.DepartmentSimpleResponse;
import vn.acme.paperless_meeting.dto.response.position.PositionSimpleResponse;
import vn.acme.paperless_meeting.dto.response.role.RoleSimpleResponse;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

@Getter
@Setter
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private UserStatus status;
    private String avatar;
    private Boolean isFirstLogin;
    private LocalDateTime createdAt;
    private DepartmentSimpleResponse department;
    private RoleSimpleResponse role;
    private PositionSimpleResponse position;

}
