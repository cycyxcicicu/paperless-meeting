package vn.acme.paperless_meeting.service.User;

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
            Role role
        ) {}

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
        
        User currentUser = currentUserService.getCurrentActiveUser();
        String currentUserRole = currentUserService.getCurrentUserRole();
        
        if (currentUserRole.equals(RoleName.USER.getAuthority())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        } else if (currentUserRole.equals(RoleName.DEPARTMENT_ADMIN.getAuthority())) {
            if (currentUser.getDepartment() == null) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            departmentId = currentUser.getDepartment().getId();
        }

        if (userRepository.existsByUsername(username)) {
            errors.put("username", ErrorCode.USER_EXISTED.getMessage());
        }

        if (userRepository.existsByEmail(email)) {
            errors.put("email", ErrorCode.EMAIL_EXISTED.getMessage());
        }

        if (userRepository.existsByPhone(phone)) {
            errors.put("phone", ErrorCode.PHONE_EXISTED.getMessage());
        }

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
                if (currentUserRole.equals(RoleName.DEPARTMENT_ADMIN.getAuthority()) &&
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

        User user = currentUserService.getCurrentActiveUser();

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // super admin can query all users (no department restriction)
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            // department admin can only query users within their primary department
            departmentId = getPrimaryDepartmentOrThrow(user).getId();
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
        // parse status
        UserStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = UserStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
        }

        Specification<User> spec = UserSpecification.build(keyword, status, role, departmentId);

        Page<User> page = userRepository.findAll(spec, pageable);

        // two-step fetch: load collections for users returned in the page to avoid N+1
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
        return userMapper.toResponse(getUser(id));
    }

    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest request) {
        User user = getUser(id);

        // Authorization: SUPER_ADMIN can update any user;
        // DEPARTMENT_ADMIN can update users in their primary department;
        // others only update their own account
        User caller = currentUserService.getCurrentActiveUser();
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // allowed
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            UUID adminDeptId = getPrimaryDepartmentOrThrow(caller).getId();

            if (!isUserInDepartment(user, adminDeptId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        } else {
            // regular user: only update own account
            if (!caller.getId().equals(id)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        validateDuplicatedFields(request.getUsername(), request.getEmail(), request.getPhone(), id);

        Department department;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
        } else {
            department = getPrimaryDepartmentOrThrow(user);
        }

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            UUID adminDeptId = getPrimaryDepartmentOrThrow(caller).getId();

            if (!adminDeptId.equals(department.getId())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        Position position = validatePosition(request.getPositionId(), department.getId());

        userMapper.updateEntity(request, user);
        user.setDepartment(department);
        user.setPosition(position);

        // Cập nhật role nếu có roleId (User → Role là N-1)
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXIST));

            String callerRoleStr = currentUserService.getCurrentUserRole();
            if (callerRoleStr.equals(RoleName.USER.getAuthority())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            } else if (callerRoleStr.equals(RoleName.DEPARTMENT_ADMIN.getAuthority())) {
                if (!role.getRoleName().equals(RoleName.USER.name())) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED); // Không được gán role cao hơn
                }
            }
            
            user.setRole(role);
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserResponse() {
        User user = currentUserService.getCurrentActiveUser();
        return userMapper.toResponse(user);
    }

    public void delete(UUID id) {
        User user = getUser(id);
        User caller = currentUserService.getCurrentActiveUser();

        // Authorization: only SUPER_ADMIN can delete any user;
        // DEPARTMENT_ADMIN can delete users in their primary department; others
        // forbidden
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // allowed
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            UUID adminDeptId = getPrimaryDepartmentOrThrow(caller).getId();

            if (!isUserInDepartment(user, adminDeptId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

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
            errors.put("username",ErrorCode.USER_EXISTED.getMessage());
        }

        boolean existedEmail = id == null
                ? userRepository.existsByEmail(email)
                : userRepository.existsByEmailAndIdNot(email, id);
        if (existedEmail) {
            errors.put("email",ErrorCode.EMAIL_EXISTED.getMessage());
        }

        boolean existedPhone = id == null
                ? userRepository.existsByPhone(phone)
                : userRepository.existsByPhoneAndIdNot(phone, id);
        if (existedPhone) {
            errors.put("phone",ErrorCode.PHONE_EXISTED.getMessage());
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }
    }

    private Department getPrimaryDepartment(User user) {
        return user.getDepartment();
    }

    private Department getPrimaryDepartmentOrThrow(User user) {
        Department department = getPrimaryDepartment(user);
        if (department == null) {
            throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
        }
        return department;
    }

    private boolean isUserInDepartment(User user, UUID departmentId) {
        if (departmentId == null) {
            return false;
        }
        return user.getDepartment() != null && departmentId.equals(user.getDepartment().getId());
    }

}
