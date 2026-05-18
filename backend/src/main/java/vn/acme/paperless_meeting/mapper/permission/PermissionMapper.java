package vn.acme.paperless_meeting.mapper.permission;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.permission.PermissionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.permission.PermissionResponse;
import vn.acme.paperless_meeting.entity.Permission;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface PermissionMapper {
    Permission toEntity(PermissionUpsertRequest request);

    void updateEntity(PermissionUpsertRequest request, @MappingTarget Permission permission);

    PermissionResponse toResponse(Permission permission);
}
