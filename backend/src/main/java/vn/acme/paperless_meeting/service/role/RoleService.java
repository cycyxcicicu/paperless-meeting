package vn.acme.paperless_meeting.service.role;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.role.RoleUpsertRequest;
import vn.acme.paperless_meeting.dto.response.role.RoleResponse;
import vn.acme.paperless_meeting.entity.Permission;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.RolePermission;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.role.RoleMapper;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;
    vn.acme.paperless_meeting.repository.PermissionRepository permissionRepository;
    UserRepository userRepository;

    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .toList();
    }

    public RoleResponse findById(UUID id) {
        return roleMapper.toResponse(getRole(id));
    }

    public RoleResponse create(RoleUpsertRequest request) {
        if (roleRepository.existsByRoleName(request.getRoleName())) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }

        Role role = roleMapper.toEntity(request);
        role.setRoleName(request.getRoleName().toUpperCase());
        if (request.getPermCodes() != null) {
            if (permissionRepository.countByPermCodeIn(request.getPermCodes()) != request.getPermCodes().size()) {
                throw new AppException(ErrorCode.PERMISSION_NOT_EXIST);
            }
            Set<Permission> perms = permissionRepository.findByPermCodeIn(request.getPermCodes());
            // clear existing links (orphanRemoval will delete them)
            role.getRolePermissionSet().clear();
            for (Permission p : perms) {
                RolePermission rp = new RolePermission();
                rp.setRole(role);
                rp.setPermission(p);
                role.getRolePermissionSet().add(rp);

                p.getRolePermissionList().add(rp);
            }
        }
        return roleMapper.toResponse(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse update(UUID id, RoleUpsertRequest request) {
        Role role = getRole(id);

        if (roleRepository.existsByRoleNameAndIdNot(request.getRoleName(), id)) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }

        roleMapper.updateEntity(request, role);
        role.setRoleName(request.getRoleName().toUpperCase());

        if (request.getPermCodes() != null) {
            if (permissionRepository.countByPermCodeIn(request.getPermCodes()) != request.getPermCodes().size()) {
                throw new AppException(ErrorCode.PERMISSION_NOT_EXIST);
            }
            Set<Permission> perms = permissionRepository.findByPermCodeIn(request.getPermCodes());
            role.getRolePermissionSet().clear();
            for (Permission p : perms) {
                RolePermission rp = new RolePermission();
                rp.setRole(role);
                rp.setPermission(p);

                role.getRolePermissionSet().add(rp);
                p.getRolePermissionList().add(rp);
            }

        }
        return roleMapper.toResponse(roleRepository.save(role));
    }

    public void delete(UUID id) {
        Role role = getRole(id);

        User deletedBy = null;
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            deletedBy = userRepository.findByUsernameAndStatus(username, UserStatus.ACTIVE)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        } catch (Exception ignored) {
        }

        if (deletedBy != null) {
            role.softDelete(deletedBy);
            roleRepository.save(role);
        } else {
            roleRepository.delete(role);
        }
    }

    private Role getRole(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXIST));
    }
}
