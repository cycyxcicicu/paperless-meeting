package vn.acme.paperless_meeting.service.permission;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.permission.PermissionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.permission.PermissionResponse;
import vn.acme.paperless_meeting.entity.Permission;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.permission.PermissionMapper;
import vn.acme.paperless_meeting.repository.PermissionRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    public List<PermissionResponse> findAll() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toResponse)
                .toList();
    }

    public PermissionResponse findById(UUID id) {
        return permissionMapper.toResponse(getPermission(id));
    }

    public PermissionResponse create(PermissionUpsertRequest request) {
        if (permissionRepository.existsByPermCode(request.getPermCode())) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }

        Permission permission = permissionMapper.toEntity(request);

        return permissionMapper.toResponse(permissionRepository.save(permission));
    }

    public PermissionResponse update(UUID id, PermissionUpsertRequest request) {
        Permission permission = getPermission(id);

        if (permissionRepository.existsByPermCodeAndIdNot(request.getPermCode(), id)) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }

        permissionMapper.updateEntity(request, permission);

        return permissionMapper.toResponse(permissionRepository.save(permission));
    }

    public void delete(UUID id) {
        Permission permission = getPermission(id);
        permissionRepository.delete(permission);
    }

    private Permission getPermission(UUID id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_EXIST));
    }
}
