package vn.acme.paperless_meeting.mapper.role;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.role.RoleUpsertRequest;
import vn.acme.paperless_meeting.dto.response.role.RoleResponse;
import vn.acme.paperless_meeting.entity.Role;

import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoleMapper {
    Role toEntity(RoleUpsertRequest request);

    void updateEntity(RoleUpsertRequest request, @MappingTarget Role role);

    @Mapping(target = "permCodes", expression = "java(role.getRolePermissionSet() == null ? java.util.Collections.emptySet() : role.getRolePermissionSet().stream().map(rp -> rp.getPermission()).filter(java.util.Objects::nonNull).map(p -> p.getPermCode()).collect(java.util.stream.Collectors.toSet()))")
    RoleResponse toResponse(Role role);
}
