package vn.acme.paperless_meeting.mapper.role;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.role.RoleUpsertRequest;
import vn.acme.paperless_meeting.dto.response.role.RoleResponse;
import vn.acme.paperless_meeting.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rolePermissionList", ignore = true)
    @Mapping(target = "userRoleScopeList", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    @Mapping(target = "approvalStepList", ignore = true)
    Role toEntity(RoleUpsertRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rolePermissionList", ignore = true)
    @Mapping(target = "userRoleScopeList", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    @Mapping(target = "approvalStepList", ignore = true)
    void updateEntity(RoleUpsertRequest request, @MappingTarget Role role);

    RoleResponse toResponse(Role role);
}
