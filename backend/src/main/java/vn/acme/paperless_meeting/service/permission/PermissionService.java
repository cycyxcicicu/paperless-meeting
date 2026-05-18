package vn.acme.paperless_meeting.service.permission;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.Arrays;
import vn.acme.paperless_meeting.entity.enums.PermissionName;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.permission.PermissionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.permission.PermissionResponse;
import vn.acme.paperless_meeting.entity.Permission;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.RolePermission;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.permission.PermissionMapper;
import vn.acme.paperless_meeting.repository.PermissionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;
    RoleRepository roleRepository;
    UserRepository userRepository;

    public List<PermissionResponse> findAll() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toResponse)
                .toList();
    }

    public PermissionResponse findById(UUID id) {
        return permissionMapper.toResponse(getPermission(id));
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PermissionResponse create(PermissionUpsertRequest request) {
        if (permissionRepository.existsByPermCode(request.getPermCode())) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }
        Permission permission = permissionMapper.toEntity(request);

        permission.setPermCode(request.getPermCode().toUpperCase());
        if (request.getRoleCodes() != null) {

            if (roleRepository.countByRoleCodeIn(request.getRoleCodes()) != request.getRoleCodes().size()) {
                throw new AppException(ErrorCode.ROLE_NOT_EXIST);
            }

            Set<Role> roles = roleRepository.findByRoleCodeIn(request.getRoleCodes());
            permission.setRolePermissionList(new HashSet<>());
            for (Role r : roles) {
                RolePermission rp = new RolePermission();
                rp.setRole(r);
                rp.setPermission(permission);
                permission.getRolePermissionList().add(rp);
                r.getRolePermissionSet().add(rp);
            }
            
        }
        return permissionMapper.toResponse(permissionRepository.save(permission));
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PermissionResponse update(UUID id, PermissionUpsertRequest request) {
        Permission permission = getPermission(id);

        boolean isCorePerm = Arrays.stream(PermissionName.values()).anyMatch(pn -> pn.name().equals(permission.getPermCode().toUpperCase()));
        String normalizedCode = request.getPermCode().toUpperCase();

        if (isCorePerm && !permission.getPermCode().toUpperCase().equals(normalizedCode)) {
            throw new AppException(ErrorCode.SYSTEM_PERMISSION_PROTECTED);
        }

        if (permissionRepository.existsByPermCodeAndIdNot(request.getPermCode(), id)) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }

        // update basic fields
        permissionMapper.updateEntity(request, permission);
        permission.setPermCode(request.getPermCode().toUpperCase());

        // if roleCodes provided, validate and update RolePermission links
        if (request.getRoleCodes() != null) {
            if (roleRepository.countByRoleCodeIn(request.getRoleCodes()) != request.getRoleCodes().size()) {
                throw new AppException(ErrorCode.ROLE_NOT_EXIST);
            }

            Set<Role> roles = roleRepository.findByRoleCodeIn(request.getRoleCodes());
            permission.getRolePermissionList().clear();
            for (Role r : roles) {
                RolePermission rp = new RolePermission();
                rp.setRole(r);
                rp.setPermission(permission);
                permission.getRolePermissionList().add(rp);
                r.getRolePermissionSet().add(rp);
            }
        }

        return permissionMapper.toResponse(permissionRepository.save(permission));
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void delete(UUID id) {
        Permission permission = getPermission(id);
        
        boolean isCorePerm = Arrays.stream(PermissionName.values()).anyMatch(pn -> pn.name().equals(permission.getPermCode().toUpperCase()));
        if (isCorePerm) {
            throw new AppException(ErrorCode.SYSTEM_PERMISSION_PROTECTED);
        }

        try {
            var rolesWithPerm = roleRepository.findByRolePermissionPermissionId(id);
            if (rolesWithPerm != null && !rolesWithPerm.isEmpty()) {
                for (Role r : rolesWithPerm) {
                    r.getRolePermissionSet().removeIf(rp -> rp.getPermission() != null && id.equals(rp.getPermission().getId()));
                }
                roleRepository.saveAll(rolesWithPerm);
            }
        } catch (Exception ignored) {
        }

        User deletedBy = null;
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            deletedBy = userRepository.findByUsernameAndStatus(username, UserStatus.ACTIVE)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        } catch (Exception ignored) {
        }

        if (deletedBy != null) {
            permission.softDelete(deletedBy);
            permissionRepository.save(permission);
        } else {
            permissionRepository.delete(permission);
        }
    }

    private Permission getPermission(UUID id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_EXIST));
    }
}
