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
    @Mapping(target = "rolePermissionSet", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    @Mapping(target = "approvalStepList", ignore = true)
    Role toEntity(RoleUpsertRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rolePermissionSet", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    @Mapping(target = "approvalStepList", ignore = true)
    void updateEntity(RoleUpsertRequest request, @MappingTarget Role role);

    @Mapping(target = "permCodes", expression = "java(role.getRolePermissionSet() == null ? java.util.Collections.emptySet() : role.getRolePermissionSet().stream().map(rp -> rp.getPermission()).filter(java.util.Objects::nonNull).map(p -> p.getPermCode()).collect(java.util.stream.Collectors.toSet()))")
    RoleResponse toResponse(Role role);
}
