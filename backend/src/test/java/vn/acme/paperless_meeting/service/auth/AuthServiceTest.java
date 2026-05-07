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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;


import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.user.UserMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
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

 

    
}
