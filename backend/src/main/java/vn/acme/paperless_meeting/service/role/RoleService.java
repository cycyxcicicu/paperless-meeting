package vn.acme.paperless_meeting.service.role;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.role.RoleUpsertRequest;
import vn.acme.paperless_meeting.dto.response.role.RoleResponse;
import vn.acme.paperless_meeting.dto.response.role.RoleStatsResponse;

import java.util.Arrays;
import vn.acme.paperless_meeting.entity.Permission;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.RolePermission;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.role.RoleMapper;
import vn.acme.paperless_meeting.repository.PermissionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;
    PermissionRepository permissionRepository;
    UserRepository userRepository;

  
    public List<RoleResponse> findAll(String keyword) {
        List<Role> roles;
        if (keyword != null && !keyword.trim().isEmpty()) {
            roles = roleRepository.findAllByKeyword(keyword.trim());
        } else {
            roles = roleRepository.findAll();
        }
        return roles.stream()
                .map(roleMapper::toResponse)
                .toList();
    }

    public RoleStatsResponse getRoleStats() {
        long totalRoles = roleRepository.count();
        long activeRoles = roleRepository.countRolesInUse(); 

        long usersWithoutRole = userRepository.countByRoleIsNull();

        return RoleStatsResponse.builder()
                .totalRoles(totalRoles)
                .activeRoles(activeRoles)
                .usersWithoutRole(usersWithoutRole)
                .build();
    }

  
    public RoleResponse findById(UUID id) {
        return roleMapper.toResponse(getRole(id));
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public RoleResponse create(RoleUpsertRequest request) {
        String normalizedRoleCode = request.getRoleCode().trim().toUpperCase();
        
        Map<String, String> errors = new HashMap<>();

        if (roleRepository.existsByRoleCode(normalizedRoleCode)) {
            errors.put("roleCode", ErrorCode.ROLE_EXISTED.getMessage());
        }

        if (request.getPermCodes() != null) {
            if (permissionRepository.countByPermCodeIn(request.getPermCodes()) != request.getPermCodes().size()) {
                errors.put("permCodes", ErrorCode.PERMISSION_NOT_EXIST.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }

        Role role = roleMapper.toEntity(request);
        role.setRoleCode(normalizedRoleCode);
        role.setRoleName(request.getRoleName().trim());
        if (request.getPermCodes() != null) {
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
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public RoleResponse update(UUID id, RoleUpsertRequest request) {
        Role role = getRole(id);

        boolean isCoreRole = Arrays.stream(RoleName.values()).anyMatch(rn -> rn.name().equals(role.getRoleCode()));
        String normalizedRoleCode = request.getRoleCode().trim().toUpperCase();

        Map<String, String> errors = new HashMap<>();

        if (isCoreRole && !role.getRoleCode().equals(normalizedRoleCode)) {
            errors.put("roleCode", ErrorCode.SYSTEM_ROLE_PROTECTED.getMessage());
        } else if (roleRepository.existsByRoleCodeAndIdNot(normalizedRoleCode, id)) {
            errors.put("roleCode", ErrorCode.ROLE_EXISTED.getMessage());
        }

        if (request.getPermCodes() != null) {
            if (permissionRepository.countByPermCodeIn(request.getPermCodes()) != request.getPermCodes().size()) {
                errors.put("permCodes", ErrorCode.PERMISSION_NOT_EXIST.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }

        roleMapper.updateEntity(request, role);
        role.setRoleCode(normalizedRoleCode);
        role.setRoleName(request.getRoleName().trim());

        if (request.getPermCodes() != null) {
            Set<Permission> perms = permissionRepository.findByPermCodeIn(request.getPermCodes());
            Set<UUID> newPermIds = perms.stream().map(Permission::getId).collect(Collectors.toSet());
            
            role.getRolePermissionSet().removeIf(rp -> !newPermIds.contains(rp.getPermission().getId()));
            
            Set<UUID> existingPermIds = role.getRolePermissionSet().stream()
                    .map(rp -> rp.getPermission().getId())
                    .collect(Collectors.toSet());

            for (Permission p : perms) {
                if (!existingPermIds.contains(p.getId())) {
                    RolePermission rp = new RolePermission();
                    rp.setRole(role);
                    rp.setPermission(p);
    
                    role.getRolePermissionSet().add(rp);
                    p.getRolePermissionList().add(rp);
                }
            }
        }
        return roleMapper.toResponse(roleRepository.save(role));
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void delete(UUID id) {
        Role role = getRole(id);

        // Kiểm tra xem Role đã được sử dụng chưa
        if (userRepository.existsByRole_Id(id)) {
            throw new AppException(ErrorCode.ROLE_IN_USE);
        }

        boolean isCoreRole = Arrays.stream(RoleName.values()).anyMatch(rn -> rn.name().equals(role.getRoleCode()));
        if (isCoreRole) {
            throw new AppException(ErrorCode.SYSTEM_ROLE_PROTECTED);
        }

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
