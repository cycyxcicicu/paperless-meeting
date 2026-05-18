package vn.acme.paperless_meeting.service.User;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.request.user.UserUpdateRequest;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.user.UserMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.specification.user.UserSpecification;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    RoleRepository roleRepository;
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    DepartmentRepository departmentRepository;
    PositionRepository positionRepository;
    CurrentUserService currentUserService;

    private record CreateUserValidatedData(
            Department department,
            Position position,
            Role role) {
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        CreateUserValidatedData validatedData = validateCreateFields(request.getUsername(), request.getEmail(),
                request.getPhone(), request.getDepartmentId(), request.getPositionId(), request.getRoleId());

        User user = userMapper.toEntity(request);
        user.setDepartment(validatedData.department());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPosition(validatedData.position());
        user.setRole(validatedData.role());

        return userMapper.toResponse(userRepository.save(user));
    }

    private CreateUserValidatedData validateCreateFields(String username, String email, String phone,
            UUID departmentId, UUID positionId, UUID roleId) {
        Map<String, String> errors = new HashMap<>();

        User caller = currentUserService.getCurrentActiveUser();

        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (departmentId == null) {
                if (caller.getDepartment() == null)
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                departmentId = caller.getDepartment().getId();
            } else {
                requireAdminAccessToDepartment(caller, departmentId);
            }
        }
        validateDuplicatedFields(username, email, phone, null);

        Department department = null;
        if (departmentId == null) {
            errors.put("departmentId", ErrorCode.DEPARTMENT_ID_REQUIRED.getMessage());
        } else {
            department = departmentRepository.findById(departmentId).orElse(null);
            if (department == null) {
                errors.put("departmentId", ErrorCode.DEPARTMENT_NOT_EXIST.getMessage());
            }
        }

        Position position = null;
        if (positionId == null) {
            errors.put("positionId", ErrorCode.POSITION_ID_REQUIRED.getMessage());
        } else {
            position = positionRepository.findById(positionId).orElse(null);
            if (position == null) {
                errors.put("positionId", ErrorCode.POSITION_NOT_EXIST.getMessage());
            }
        }

        Role role = null;
        if (roleId == null) {
            errors.put("roleId", ErrorCode.ROLE_ID_REQUIRED.getMessage());
        } else {
            role = roleRepository.findById(roleId).orElse(null);
            if (role == null) {
                errors.put("roleId", ErrorCode.ROLE_NOT_EXIST.getMessage());
            } else {
                if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) &&
                        !role.getRoleName().equals(RoleName.USER.name())) {
                    errors.put("roleId", "Department Admin chỉ có thể tạo người dùng với vai trò USER");
                }
            }
        }

        if (department != null && position != null) {
            if (position.getDepartment() == null ||
                    !department.getId().equals(position.getDepartment().getId())) {
                errors.put("positionId", ErrorCode.POSITION_DEPARTMENT_MISMATCH.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }

        return new CreateUserValidatedData(department, position, role);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findAll(String keyword, String statusStr, String role, UUID departmentId,
            Pageable pageable) {

        User caller = currentUserService.getCurrentActiveUser();

        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        List<UUID> searchDeptIds = null;

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            UUID adminDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (adminDeptId == null)
                throw new AppException(ErrorCode.DEPARTMENT_NOT_EXIST);

            if (departmentId == null) {
                searchDeptIds = getAllSubDepartmentIds(adminDeptId);
            } else {
                requireAdminAccessToDepartment(caller, departmentId);
                searchDeptIds = List.of(departmentId);
            }
        } else {
            // SUPER_ADMIN
            if (departmentId != null) {
                searchDeptIds = List.of(departmentId);
            }
        }

        UserStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = UserStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
        }

        Specification<User> spec = UserSpecification.build(keyword, status, role, searchDeptIds);

        Page<User> page = userRepository.findAll(spec, pageable);

        List<UUID> ids = page.getContent().stream().map(User::getId).toList();
        List<User> usersWithDeps = ids.isEmpty() ? List.of() : userRepository.findByIdIn(ids);
        var userById = usersWithDeps.stream().collect(Collectors.toMap(User::getId, u -> u));
        List<UserResponse> content = ids.stream()
                .map(userById::get)
                .map(userMapper::toResponse)
                .toList();

        PageResponse<UserResponse> resp = PageResponse.<UserResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();

        return resp;
    }

    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        User user = getUser(id);
        User caller = currentUserService.getCurrentActiveUser();

        if (!caller.getId().equals(id)) {
            if (currentUserService.hasRole(RoleName.USER)) {
                // USER thường chỉ được xem thông tin người cùng phòng ban
                if (caller.getDepartment() == null || user.getDepartment() == null ||
                        !caller.getDepartment().getId().equals(user.getDepartment().getId())) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
            } else {
                // Admin thì được xem user theo phân cấp quản lý
                requireAdminAccessToDepartment(caller,
                        user.getDepartment() != null ? user.getDepartment().getId() : null);
            }
        }

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest request) {
        User user = getUser(id);
        User caller = currentUserService.getCurrentActiveUser();

        boolean isRegularUser = currentUserService.hasRole(RoleName.USER);
        boolean isSelfUpdate = caller.getId().equals(id);

        if (isRegularUser && !isSelfUpdate) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        if (!isRegularUser) {
            // Chặn Admin cấp dưới thao tác lên SUPER_ADMIN
            if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) &&
                    user.getRole() != null && user.getRole().getRoleName().equals(RoleName.SUPER_ADMIN.name())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }

            // Tối ưu N+1: Lấy danh sách cây phòng ban 1 lần và check
            if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
                if (caller.getDepartment() == null) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
                List<UUID> allowedDeptIds = getAllSubDepartmentIds(caller.getDepartment().getId());
                UUID currentDeptId = user.getDepartment() != null ? user.getDepartment().getId() : null;

                // Phải có quyền trên cả phòng ban hiện tại của User VÀ phòng ban mới muốn
                // chuyển tới
                if (!allowedDeptIds.contains(currentDeptId) || !allowedDeptIds.contains(request.getDepartmentId())) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
            }
        }

        if (isRegularUser) {
            if (user.getDepartment() == null || !request.getDepartmentId().equals(user.getDepartment().getId()) ||
                    user.getPosition() == null || !request.getPositionId().equals(user.getPosition().getId()) ||
                    user.getRole() == null || !request.getRoleId().equals(user.getRole().getId()) ||
                    !request.getStatus().equals(user.getStatus())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        // Tối ưu: Đã qua các bước gác cổng an ninh, giờ mới gọi Database
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));

        validateDuplicatedFields(request.getUsername(), request.getEmail(), request.getPhone(), id);

        Position position = validatePosition(request.getPositionId(), department.getId());

        userMapper.updateEntity(request, user);
        user.setDepartment(department);
        user.setPosition(position);

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXIST));

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            // Chỉ kiểm tra gán role nếu admin CÓ THAY ĐỔI role của user
            if (!role.getId().equals(user.getRole() != null ? user.getRole().getId() : null)) {
                if (!role.getRoleName().equals(RoleName.USER.name())) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED); // Không được gán role cao hơn
                }
            }
        }

        user.setRole(role);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (isSelfUpdate) {
                // Bảo mật: Ngăn chặn TẤT CẢ tự đổi mật khẩu qua luồng chung để lách mật khẩu
                // cũ.
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setIsFirstLogin(true); // Đánh dấu để ép user đổi lại mật khẩu
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserResponse() {
        User user = currentUserService.getCurrentActiveUser();
        UserResponse response = userMapper.toResponse(user);

        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            java.util.Set<String> perms = auth.getAuthorities().stream()
                    .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                    .filter(a -> !a.startsWith("ROLE_"))
                    .collect(java.util.stream.Collectors.toSet());
            response.setPermissions(perms);
        }

        return response;
    }

    public void delete(UUID id) {
        User user = getUser(id);
        User caller = currentUserService.getCurrentActiveUser();

        // Chặn Admin cấp dưới xóa SUPER_ADMIN
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) &&
                user.getRole() != null && user.getRole().getRoleName().equals(RoleName.SUPER_ADMIN.name())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        requireAdminAccessToDepartment(caller, user.getDepartment() != null ? user.getDepartment().getId() : null);

        user.softDelete(caller);
        userRepository.save(user);
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Position validatePosition(UUID positionId, UUID departmentId) {
        if (positionId == null) {
            throw new AppException(ErrorCode.POSITION_ID_REQUIRED);
        }

        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new AppException(ErrorCode.POSITION_NOT_EXIST));

        if (position.getDepartment() == null || !departmentId.equals(position.getDepartment().getId())) {
            throw new AppException(ErrorCode.POSITION_DEPARTMENT_MISMATCH);
        }

        return position;
    }

    private void validateDuplicatedFields(String username, String email, String phone, UUID id) {
        Map<String, String> errors = new HashMap<>();
        boolean existedUsername = id == null
                ? userRepository.existsByUsername(username)
                : userRepository.existsByUsernameAndIdNot(username, id);
        if (existedUsername) {
            errors.put("username", ErrorCode.USER_EXISTED.getMessage());
        }

        boolean existedEmail = id == null
                ? userRepository.existsByEmail(email)
                : userRepository.existsByEmailAndIdNot(email, id);
        if (existedEmail) {
            errors.put("email", ErrorCode.EMAIL_EXISTED.getMessage());
        }

        boolean existedPhone = id == null
                ? userRepository.existsByPhone(phone)
                : userRepository.existsByPhoneAndIdNot(phone, id);
        if (existedPhone) {
            errors.put("phone", ErrorCode.PHONE_EXISTED.getMessage());
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }
    }

    private void requireAdminAccessToDepartment(User admin, UUID targetDeptId) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN))
            return;
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (admin.getDepartment() == null || targetDeptId == null) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            if (!getAllSubDepartmentIds(admin.getDepartment().getId()).contains(targetDeptId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            return;
        }
        throw new AppException(ErrorCode.UNAUTHOZIZED);
    }

    private List<UUID> getAllSubDepartmentIds(UUID rootDeptId) {
        if (rootDeptId == null)
            return List.of();
        List<UUID> allIds = new ArrayList<>();
        allIds.add(rootDeptId);

        List<UUID> current = List.of(rootDeptId);
        while (!current.isEmpty()) {
            List<UUID> childIds = departmentRepository.findIdsByParentDepartmentIdIn(current);
            if (childIds == null || childIds.isEmpty()) {
                break;
            }
            allIds.addAll(childIds);
            current = childIds;
        }
        return allIds;
    }

}
