package vn.acme.paperless_meeting.service.User;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;

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

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    UserMapper userMapper;
    @Mock
    PasswordEncoder passwordEncoder;
    @Mock
    DepartmentRepository departmentRepository;
    @Mock
    PositionRepository positionRepository;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    RoleRepository roleRepository;
    @Mock
    AuditLogPublisher auditLogPublisher;

    @InjectMocks
    UserService userService;

    private UUID userId;
    private UUID departmentId;
    private UUID otherDepartmentId;
    private UUID positionId;
    private UUID roleId;
    private User user;
    private Department department;
    private Department otherDepartment;
    private Position position;
    private Position otherPosition;
    private Role role;
    private UserUpdateRequest request;
    private UserResponse response;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        departmentId = UUID.randomUUID();
        otherDepartmentId = UUID.randomUUID();
        positionId = UUID.randomUUID();
        roleId = UUID.randomUUID();

        department = new Department();
        department.setId(departmentId);
        department.setDeptName("Department A");

        otherDepartment = new Department();
        otherDepartment.setId(otherDepartmentId);
        otherDepartment.setDeptName("Department B");

        position = new Position();
        position.setId(positionId);
        position.setPositionName("Manager");
        position.setPositionCode("MGR");
        position.setDepartment(department);

        otherPosition = new Position();
        otherPosition.setId(UUID.randomUUID());
        otherPosition.setPositionName("Other");
        otherPosition.setPositionCode("OTHER");
        otherPosition.setDepartment(otherDepartment);

        role = new Role();
        role.setId(roleId);
        role.setRoleName("USER");

        user = new User();
        user.setId(userId);
        user.setUsername("user01");
        user.setEmail("user01@example.com");
        user.setPhone("0900000001");
        user.setFullName("User One");
        user.setStatus(UserStatus.ACTIVE);
        user.setDepartment(department);

        request = new UserUpdateRequest();
        request.setUsername("user01");
        request.setFullName("User One Updated");
        request.setEmail("user01@example.com");
        request.setPhone("0900000001");
        request.setStatus(UserStatus.ACTIVE);
        request.setPositionId(positionId);
        request.setDepartmentId(departmentId);

        response = UserResponse.builder().id(userId).build();

        lenient().when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        lenient().when(userRepository.existsByUsernameAndIdNot(request.getUsername(), userId)).thenReturn(false);
        lenient().when(userRepository.existsByEmailAndIdNot(request.getEmail(), userId)).thenReturn(false);
        lenient().when(userRepository.existsByPhoneAndIdNot(request.getPhone(), userId)).thenReturn(false);
        lenient().when(userRepository.save(user)).thenReturn(user);
        lenient().when(userMapper.toResponse(user)).thenReturn(response);
        lenient().when(currentUserService.getCurrentActiveUser()).thenReturn(user);
        lenient().when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        lenient().when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));
        lenient().when(roleRepository.findById(null)).thenReturn(Optional.of(role));
        lenient().when(departmentRepository.findById(null)).thenReturn(Optional.of(department));
    }

    @Test
    void update_whenPositionMatchesDepartment_shouldSucceed() {
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));

        UserResponse result = userService.update(userId, request);

        assertSame(response, result);
        assertSame(position, user.getPosition());
        assertSame(department, user.getDepartment());
        verify(userRepository).save(user);
    }

    @Test
    void update_whenPositionBelongsToOtherDepartment_shouldThrow() {
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(otherPosition));
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));
        lenient().when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () -> userService.update(userId, request));

        assertEquals(ErrorCode.POSITION_DEPARTMENT_MISMATCH, exception.getErrorCode());
    }

    @Test
    void update_whenUserHasPrimaryInUserDepartmentAndRequestNoDept_shouldUsePrimaryDepartment() {
        // user has no direct department set
        user.setDepartment(null);

        // user has primary department set on the user entity in the new model
        user.setDepartment(department);

        // request does not specify department -> should fallback to primary assignment
        request.setDepartmentId(null);

        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));

        UserResponse result = userService.update(userId, request);

        assertSame(response, result);
        assertSame(position, user.getPosition());
        assertSame(department, user.getDepartment());
        verify(userRepository).save(user);
    }
    @Test
    void create_whenValidRequest_shouldSucceed() {
        UserCreateRequest createRequest = buildCreateRequest();
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        when(userRepository.existsByUsername(createRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByPhone(createRequest.getPhone())).thenReturn(false);
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));
        when(userMapper.toEntity(createRequest)).thenReturn(user);
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toResponse(user)).thenReturn(response);
        when(passwordEncoder.encode(createRequest.getPassword())).thenReturn("encoded-password");

        UserResponse result = userService.create(createRequest);

        assertSame(response, result);
        assertSame(position, user.getPosition());
        assertSame(department, user.getDepartment());
        assertSame(role, user.getRole());
        assertEquals("encoded-password", user.getPassword());
        verify(passwordEncoder).encode(createRequest.getPassword());
        verify(roleRepository).findById(roleId);
        verify(userRepository).save(user);
    }

    @Test
    void create_whenRoleDoesNotExist_shouldThrow() {
        UserCreateRequest createRequest = buildCreateRequest();
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        when(userRepository.existsByUsername(createRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByPhone(createRequest.getPhone())).thenReturn(false);
        when(roleRepository.findById(roleId)).thenReturn(Optional.empty());

        AppValidationException exception = assertThrows(AppValidationException.class, () -> userService.create(createRequest));

        assertEquals(ErrorCode.ROLE_NOT_EXIST.getMessage(), exception.getFieldErrors().get("roleId"));
    }

    @Test
    void create_whenRoleIdMissing_shouldThrow() {
        UserCreateRequest createRequest = buildCreateRequest();
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        createRequest.setRoleId(null);
        when(userRepository.existsByUsername(createRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByPhone(createRequest.getPhone())).thenReturn(false);

        AppValidationException exception = assertThrows(AppValidationException.class, () -> userService.create(createRequest));

        assertEquals(ErrorCode.ROLE_ID_REQUIRED.getMessage(), exception.getFieldErrors().get("roleId"));
    }

    @Test
    void create_whenPositionBelongsToOtherDepartment_shouldThrow() {
        UserCreateRequest createRequest = buildCreateRequest();
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(otherPosition));
        when(userRepository.existsByUsername(createRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByPhone(createRequest.getPhone())).thenReturn(false);
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));
        lenient().when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        AppValidationException exception = assertThrows(AppValidationException.class, () -> userService.create(createRequest));

        assertEquals(ErrorCode.POSITION_DEPARTMENT_MISMATCH.getMessage(), exception.getFieldErrors().get("positionId"));
    }

    private UserCreateRequest buildCreateRequest() {
        UserCreateRequest createRequest = new UserCreateRequest();
        createRequest.setUsername("user01");
        createRequest.setPassword("Password123");
        createRequest.setFullName("User One");
        createRequest.setEmail("user01@example.com");
        createRequest.setPhone("0900000001");
        createRequest.setStatus(UserStatus.ACTIVE);
        createRequest.setPositionId(positionId);
        createRequest.setDepartmentId(departmentId);
        createRequest.setRoleId(roleId);
        return createRequest;
    }

    // Note: multi-department assignments removed; user.department is authoritative
}
