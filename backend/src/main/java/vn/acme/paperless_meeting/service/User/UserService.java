package vn.acme.paperless_meeting.service.User;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import vn.acme.paperless_meeting.dto.response.user.UserStatsResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.PositionRole;
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

    record CreateUserValidatedData(
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

        Role role = null;
        if (roleId == null) {
            errors.put("roleId", ErrorCode.ROLE_ID_REQUIRED.getMessage());
        } else {
            role = roleRepository.findById(roleId).orElse(null);
            if (role == null) {
                errors.put("roleId", ErrorCode.ROLE_NOT_EXIST.getMessage());
            } else {
                if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) &&
                        !RoleName.USER.name().equals(role.getRoleCode())) {
                    errors.put("roleId", "Department Admin chỉ có thể tạo người dùng với vai trò USER");
                }
            }
        }

        if (role != null && departmentId != null && RoleName.DEPARTMENT_ADMIN.name().equals(role.getRoleCode())) {
            if (department != null && department.getParentDepartment() != null && department.getParentDepartment().getParentDepartment() != null) {
                errors.put("roleId", "Không thể tạo Admin đơn vị ở cấp phòng/ban. Chỉ được tạo ở cấp Đơn vị.");
            } else {
                boolean adminExists = userRepository.existsByDepartmentIdAndRole_RoleCode(departmentId, RoleName.DEPARTMENT_ADMIN.name());
                if (adminExists) {
                    errors.put("roleId", "Đơn vị này đã có tài khoản Admin đơn vị (tối đa 1 admin/đơn vị)");
                }
            }
        }

        Position position = null;
        boolean isDepartmentAdmin = role != null && RoleName.DEPARTMENT_ADMIN.name().equals(role.getRoleCode());
        if (positionId == null) {
            if (!isDepartmentAdmin) {
                errors.put("positionId", ErrorCode.POSITION_ID_REQUIRED.getMessage());
            }
        } else {
            position = positionRepository.findById(positionId).orElse(null);
            if (position == null) {
                errors.put("positionId", ErrorCode.POSITION_NOT_EXIST.getMessage());
            }
        }

        if (department != null && position != null) {
            // Cho phép các chức vụ hệ thống (department == null) được gán ở tất cả các đơn vị
            if (position.getDepartment() != null) {
                UUID posDeptId = position.getDepartment().getId();
                UUID targetDeptId = department.getId();
                
                if (!targetDeptId.equals(posDeptId)) {
                    User currentUser = currentUserService.getCurrentActiveUser();
                    boolean isAllowed = false;
                    if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
                        isAllowed = true;
                    } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
                        UUID callerDeptId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
                        if (callerDeptId != null) {
                            List<UUID> allowedIds = getAllSubDepartmentIds(callerDeptId);
                            if (allowedIds.contains(targetDeptId) && allowedIds.contains(posDeptId)) {
                                isAllowed = true;
                            }
                        }
                    }
                    if (!isAllowed) {
                        errors.put("positionId", ErrorCode.POSITION_DEPARTMENT_MISMATCH.getMessage());
                    }
                }
            }
            if (!errors.containsKey("positionId")) {
                try {
                    validatePositionLimits(null, department, position);
                } catch (AppValidationException e) {
                    errors.putAll(e.getFieldErrors());
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }

        return new CreateUserValidatedData(department, position, role);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findAll(String keyword, String statusStr, UUID departmentId, String roleCodeStr,
            Pageable pageable) {

        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        User caller = currentUserService.getCurrentActiveUser();
        List<UUID> searchDeptIds = null;
        RoleName roleFilter = null;
        if (roleCodeStr != null && !roleCodeStr.isBlank()) {
            try {
                roleFilter = RoleName.valueOf(roleCodeStr.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                // Ignore invalid
            }
        }

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // SUPER_ADMIN có thể truyền xuống role tùy ý để lọc (thường là lọc DEPARTMENT_ADMIN từ trang list).
            // Nếu không truyền roleFilter VÀ không truyền departmentId => Tự động khóa thành DEPARTMENT_ADMIN
            if (roleFilter == null && departmentId == null) {
                roleFilter = RoleName.DEPARTMENT_ADMIN;
            }
            if (departmentId != null) {
                searchDeptIds = List.of(departmentId);
            }
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            // DEPARTMENT_ADMIN: lấy người dùng trong cây đơn vị mình quản lý
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            List<UUID> allowedDeptIds = getAllSubDepartmentIds(callerDeptId);

            if (departmentId != null) {
                if (!allowedDeptIds.contains(departmentId)) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
                searchDeptIds = List.of(departmentId);
            } else {
                searchDeptIds = allowedDeptIds;
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

        Specification<User> spec = UserSpecification.build(keyword, status, roleFilter, searchDeptIds);

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
    public UserStatsResponse getStats() {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // SUPER_ADMIN: stats về tài khoản DEPARTMENT_ADMIN
            long total = userRepository.countByRole_RoleCode(RoleName.DEPARTMENT_ADMIN.name());
            long active = userRepository.countByRole_RoleCodeAndStatus(RoleName.DEPARTMENT_ADMIN.name(), UserStatus.ACTIVE);
            long inactive = userRepository.countByRole_RoleCodeAndStatus(RoleName.DEPARTMENT_ADMIN.name(), UserStatus.INACTIVE);
            return UserStatsResponse.builder()
                    .totalUsers(total)
                    .activeUsers(active)
                    .inactiveUsers(inactive)
                    .build();
        }

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            User caller = currentUserService.getCurrentActiveUser();
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                return UserStatsResponse.builder()
                        .totalUsers(0).activeUsers(0).inactiveUsers(0).build();
            }
            List<UUID> allowedDeptIds = getAllSubDepartmentIds(callerDeptId);
            long total = userRepository.countByDepartmentIdIn(allowedDeptIds);
            long active = userRepository.countByStatusAndDepartmentIdIn(UserStatus.ACTIVE, allowedDeptIds);
            long inactive = total - active;
            return UserStatsResponse.builder()
                    .totalUsers(total)
                    .activeUsers(active)
                    .inactiveUsers(inactive)
                    .build();
        }

        throw new AppException(ErrorCode.UNAUTHOZIZED);
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
                    user.getRole() != null && user.getRole().getRoleCode().equals(RoleName.SUPER_ADMIN.name())) {
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
            if (user.getDepartment() == null || !java.util.Objects.equals(request.getDepartmentId(), user.getDepartment().getId()) ||
                    !java.util.Objects.equals(request.getPositionId(), user.getPosition() != null ? user.getPosition().getId() : null) ||
                    user.getRole() == null || !java.util.Objects.equals(request.getRoleId(), user.getRole().getId()) ||
                    !java.util.Objects.equals(request.getStatus(), user.getStatus())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        // Tối ưu: Đã qua các bước gác cổng an ninh, giờ mới gọi Database
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));

        validateDuplicatedFields(request.getUsername(), request.getEmail(), request.getPhone(), id);

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXIST));

        boolean isDepartmentAdmin = RoleName.DEPARTMENT_ADMIN.name().equals(role.getRoleCode());

        Position position = null;
        if (request.getPositionId() != null) {
            position = validatePosition(request.getPositionId(), department.getId());
            validatePositionLimits(id, department, position);
        } else if (!isDepartmentAdmin) {
            throw new AppException(ErrorCode.POSITION_ID_REQUIRED);
        }

        userMapper.updateEntity(request, user);
        user.setDepartment(department);
        user.setPosition(position);

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            // Chỉ kiểm tra gán role nếu admin CÓ THAY ĐỔI role của user
            if (!role.getId().equals(user.getRole() != null ? user.getRole().getId() : null)) {
                if (!RoleName.USER.name().equals(role.getRoleCode())) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED); // Không được gán role cao hơn
                }
            }
        }

        if (RoleName.DEPARTMENT_ADMIN.name().equals(role.getRoleCode())) {
            if (department.getParentDepartment() != null && department.getParentDepartment().getParentDepartment() != null) {
                throw new AppValidationException(Map.of("roleId", "Không thể tạo Admin đơn vị ở cấp phòng/ban. Chỉ được tạo ở cấp Đơn vị."));
            }
            boolean adminExists = userRepository.existsByDepartmentIdAndRole_RoleCodeAndIdNot(department.getId(), RoleName.DEPARTMENT_ADMIN.name(), id);
            if (adminExists) {
                throw new AppValidationException(Map.of("roleId", "Đơn vị này đã có tài khoản Admin đơn vị (tối đa 1 admin/đơn vị)"));
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
           Set<String> perms = auth.getAuthorities().stream()
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

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) &&
                user.getRole() != null && user.getRole().getRoleCode().equals(RoleName.SUPER_ADMIN.name())) {
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

        // Cho phép các chức vụ hệ thống (department == null) được gán ở tất cả các đơn vị
        if (position.getDepartment() != null) {
            UUID posDeptId = position.getDepartment().getId();
            if (!departmentId.equals(posDeptId)) {
                User currentUser = currentUserService.getCurrentActiveUser();
                boolean isAllowed = false;
                if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
                    isAllowed = true;
                } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
                    UUID callerDeptId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
                    if (callerDeptId != null) {
                        List<UUID> allowedIds = getAllSubDepartmentIds(callerDeptId);
                        if (allowedIds.contains(departmentId) && allowedIds.contains(posDeptId)) {
                            isAllowed = true;
                        }
                    }
                }
                if (!isAllowed) {
                    throw new AppException(ErrorCode.POSITION_DEPARTMENT_MISMATCH);
                }
            }
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

    private void validatePositionLimits(UUID userId, Department department, Position position) {
        if (position == null || position.getPositionRole() == null || department == null) {
            return;
        }

        PositionRole role = position.getPositionRole();
        
        long currentCount = department.getUserList().stream()
                .filter(u -> userId == null || !u.getId().equals(userId))
                .filter(u -> u.getPosition() != null && role.equals(u.getPosition().getPositionRole()))
                .count();

        Map<String, String> errors = new HashMap<>();

        switch (role) {
            case CHAIRMAN_CITY:
                if (currentCount >= 1) {
                    errors.put("positionId", "Đơn vị đã có Chủ tịch Ủy ban nhân dân thành phố (tối đa 1)");
                }
                break;
            case VICE_CHAIRMAN_CITY:
                if (currentCount >= 6) {
                    errors.put("positionId", "Đơn vị đã đạt số lượng tối đa Phó Chủ tịch Ủy ban nhân dân thành phố (tối đa 6)");
                }
                break;
            case HEAD_OF_DEPARTMENT_LEVEL:
                if (currentCount >= 1) {
                    errors.put("positionId", "Đơn vị đã có Thủ trưởng đứng đầu (tối đa 1)");
                }
                break;
            case DEPUTY_OF_DEPARTMENT_LEVEL:
                if (currentCount >= 3) {
                    errors.put("positionId", "Đơn vị đã đạt số lượng tối đa cấp Phó Thủ trưởng (tối đa 3)");
                }
                break;
            case HEAD_OF_DIVISION:
                if (currentCount >= 1) {
                    errors.put("positionId", "Đơn vị đã có Trưởng phòng/Đầu mối phụ trách (tối đa 1)");
                }
                break;
            case DEPUTY_OF_DIVISION:
                int staffCount = department.getUserList() != null ? department.getUserList().size() : 0;
                int maxDeputies;
                if (staffCount < 10) {
                    maxDeputies = 1;
                } else if (staffCount <= 14) {
                    maxDeputies = 2;
                } else {
                    maxDeputies = 3;
                }
                if (currentCount >= maxDeputies) {
                    errors.put("positionId", String.format(
                        "Quá số lượng Phó Trưởng phòng theo quy định biên chế (Quy mô: %d người, tối đa cho phép: %d)",
                        staffCount, maxDeputies
                    ));
                }
                break;
            default:
                break;
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }
    }
}
