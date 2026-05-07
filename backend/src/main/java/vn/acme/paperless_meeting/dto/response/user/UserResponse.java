package vn.acme.paperless_meeting.dto.response.user;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import vn.acme.paperless_meeting.dto.response.department.DepartmentSimpleResponse;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.dto.response.role.RoleSimpleResponse;
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
    private UUID positionId;
    private String positionName;
    private String positionCode;
    private DepartmentSimpleResponse department;
    private RoleSimpleResponse role;
    private PositionResponse position;
}
