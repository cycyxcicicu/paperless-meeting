package vn.acme.paperless_meeting.service.role;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.role.RoleUpsertRequest;
import vn.acme.paperless_meeting.dto.response.role.RoleResponse;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.role.RoleMapper;
import vn.acme.paperless_meeting.repository.RoleRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;

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

        return roleMapper.toResponse(roleRepository.save(role));
    }

    public RoleResponse update(UUID id, RoleUpsertRequest request) {
        Role role = getRole(id);

        if (roleRepository.existsByRoleNameAndIdNot(request.getRoleName(), id)) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }

        roleMapper.updateEntity(request, role);

        return roleMapper.toResponse(roleRepository.save(role));
    }

    public void delete(UUID id) {
        Role role = getRole(id);
        roleRepository.delete(role);
    }

    private Role getRole(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXIST));
    }
}
