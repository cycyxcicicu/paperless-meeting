package vn.acme.paperless_meeting.mapper.permission;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.permission.PermissionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.permission.PermissionResponse;
import vn.acme.paperless_meeting.entity.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rolePermissionList", ignore = true)
    Permission toEntity(PermissionUpsertRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rolePermissionList", ignore = true)
    void updateEntity(PermissionUpsertRequest request, @MappingTarget Permission permission);

    PermissionResponse toResponse(Permission permission);
}
