package vn.acme.paperless_meeting.service.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;


import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.user.UserMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    AuthenticationManager authenticationManager;
    @Mock
    JwtTokenGenerator jwtTokenGenerator;
    @Mock
    JwtTokenVerifier jwtTokenVerifier;
    @Mock
    AuthCookieService authCookieService;
    @Mock
    RefreshTokenService refreshTokenService;
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
    RoleRepository roleRepository;
    @Mock
    AuditLogPublisher auditLogPublisher;

    @InjectMocks
    AuthService authService;

    private UUID departmentId;
    private UUID otherDepartmentId;
    private UUID positionId;
    private UUID roleId;
    private UserCreateRequest request;
    private Department department;
    private Department otherDepartment;
    private Position position;
    private Position otherPosition;
    private Role role;
    private User user;
    private UserResponse response;

    @BeforeEach
    void setUp() {
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

        request = new UserCreateRequest();
        request.setUsername("user01");
        request.setPassword("Password123");
        request.setFullName("User One");
        request.setEmail("user01@example.com");
        request.setPhone("0900000001");
        request.setDepartmentId(departmentId);
        request.setPositionId(positionId);
        request.setRoleId(roleId);

        user = new User();
        response = UserResponse.builder().id(UUID.randomUUID()).build();

        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.existsByPhone(request.getPhone())).thenReturn(false);
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));
        lenient().when(userMapper.toEntity(request)).thenReturn(user);
        lenient().when(userRepository.save(user)).thenReturn(user);
        lenient().when(userMapper.toResponse(user)).thenReturn(response);
        lenient().when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
    }

 

    // =====================================================================
    // changePassword — validate mật khẩu cũ sai, luồng thành công
    // =====================================================================

    @Test
    void changePassword_WhenOldPasswordWrong_ShouldThrowBadCredentials() {
        // Arrange
        String username = "user01";
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn(username);

        User user = new User();
        user.setUsername(username);
        user.setPassword("encoded-correct-password");

        when(userRepository.findWithRoleByUsernameAndStatus(username, vn.acme.paperless_meeting.entity.enums.UserStatus.ACTIVE))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-old-password", "encoded-correct-password")).thenReturn(false);

        vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest req = new vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest();
        req.setOldPassword("wrong-old-password");
        req.setNewPassword("NewPassword123");

        // Act & Assert
        assertThrows(org.springframework.security.authentication.BadCredentialsException.class, () -> {
            authService.changePassword(auth, req);
        });
    }

    @Test
    void changePassword_WhenUserNotActive_ShouldThrowException() {
        // Arrange
        String username = "user01";
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn(username);

        when(userRepository.findWithRoleByUsernameAndStatus(username, vn.acme.paperless_meeting.entity.enums.UserStatus.ACTIVE))
                .thenReturn(Optional.empty()); // User không active

        vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest req = new vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest();
        req.setOldPassword("OldPass");
        req.setNewPassword("NewPass");

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            authService.changePassword(auth, req);
        });
        assertEquals(ErrorCode.USER_NOT_EXISTED, ex.getErrorCode());
    }

    @Test
    void changePassword_Success_ShouldEncodeAndSaveNewPassword() {
        // Arrange
        String username = "user01";
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn(username);

        User user = new User();
        user.setUsername(username);
        user.setPassword("encoded-old-password");

        when(userRepository.findWithRoleByUsernameAndStatus(username, vn.acme.paperless_meeting.entity.enums.UserStatus.ACTIVE))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword123")).thenReturn("encoded-new-password");
        when(userRepository.save(user)).thenReturn(user);

        vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest req = new vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest();
        req.setOldPassword("OldPassword");
        req.setNewPassword("NewPassword123");

        // Act
        assertDoesNotThrow(() -> authService.changePassword(auth, req));

        // Assert
        assertEquals("encoded-new-password", user.getPassword());
        assertFalse(user.getIsFirstLogin());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void refresh_WhenRefreshTokenNull_ShouldThrowException() {
        // Arrange — refresh token null
        AppException ex = assertThrows(AppException.class, () -> {
            authService.refresh(null, null, null);
        });
        assertEquals(ErrorCode.INVALID_KEY, ex.getErrorCode());
    }

    @Test
    void refresh_WhenRefreshTokenBlank_ShouldThrowException() {
        // Arrange — refresh token rỗng
        AppException ex = assertThrows(AppException.class, () -> {
            authService.refresh("   ", null, null);
        });
        assertEquals(ErrorCode.INVALID_KEY, ex.getErrorCode());
    }
}
