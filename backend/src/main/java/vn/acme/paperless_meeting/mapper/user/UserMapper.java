package vn.acme.paperless_meeting.mapper.user;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.request.user.UserUpdateRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentSimpleResponse;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.dto.response.position.PositionSimpleResponse;
import vn.acme.paperless_meeting.dto.response.role.RoleSimpleResponse;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;

import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {
    @Mapping(target = "password", ignore = true)
    User toEntity(UserCreateRequest request);

    @Mapping(target = "password", ignore = true)
    void updateEntity(UserUpdateRequest request, @MappingTarget User user);

    UserResponse toResponse(User user);

    @Mapping(source = "parentDepartment.id", target = "parentDepartmentId")
    DepartmentSimpleResponse toDepartmentSimpleResponse(Department department);

    RoleSimpleResponse toRoleSimpleResponse(Role role);

    PositionSimpleResponse toPositionSimpleResponse(Position position);
}
