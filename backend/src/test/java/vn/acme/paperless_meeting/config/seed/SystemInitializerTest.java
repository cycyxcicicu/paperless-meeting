package vn.acme.paperless_meeting.config.seed;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Permission;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.RolePermission;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.PositionRole;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.PermissionRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;
import vn.acme.paperless_meeting.repository.RolePermissionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class SystemInitializerTest {

    @Mock
    DepartmentRepository departmentRepository;
    @Mock
    PositionRepository positionRepository;
    @Mock
    RoleRepository roleRepository;
    @Mock
    PermissionRepository permissionRepository;
    @Mock
    RolePermissionRepository rolePermissionRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    SystemInitializer systemInitializer;

    @BeforeEach
    void setUp() {
        // Stub save calls to return the saved entity to simulate JPA behavior
        lenient().when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department dept = invocation.getArgument(0);
            if (dept.getId() == null) {
                dept.setId(UUID.randomUUID());
            }
            return dept;
        });

        lenient().when(positionRepository.save(any(Position.class))).thenAnswer(invocation -> {
            Position pos = invocation.getArgument(0);
            if (pos.getId() == null) {
                pos.setId(UUID.randomUUID());
            }
            return pos;
        });

        lenient().when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
            Role role = invocation.getArgument(0);
            if (role.getId() == null) {
                role.setId(UUID.randomUUID());
            }
            return role;
        });

        lenient().when(permissionRepository.save(any(Permission.class))).thenAnswer(invocation -> {
            Permission perm = invocation.getArgument(0);
            if (perm.getId() == null) {
                perm.setId(UUID.randomUUID());
            }
            return perm;
        });

        lenient().when(rolePermissionRepository.save(any(RolePermission.class))).thenAnswer(invocation -> {
            RolePermission rp = invocation.getArgument(0);
            if (rp.getId() == null) {
                rp.setId(UUID.randomUUID());
            }
            return rp;
        });

        lenient().when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            if (u.getId() == null) {
                u.setId(UUID.randomUUID());
            }
            return u;
        });

        // Other common stubs
        lenient().when(departmentRepository.findAll()).thenReturn(new java.util.ArrayList<>());
        lenient().when(positionRepository.findAll()).thenReturn(new java.util.ArrayList<>());
        lenient().when(roleRepository.findAll()).thenReturn(new java.util.ArrayList<>());
        lenient().when(permissionRepository.findAll()).thenReturn(new java.util.ArrayList<>());
        lenient().when(rolePermissionRepository.findPermissionCodesByRoleId(any())).thenReturn(Collections.emptySet());
        lenient().when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
    }

    @Test
    void run_shouldInitializeAllStandardProductionData() {
        // Run initializer
        systemInitializer.run();

        // 1. Verify departments are seeded
        // Root: "UBND thành phố Hải Phòng" (1) + 20 blueprints + their child units
        // Let's verify department save was called multiple times
        verify(departmentRepository, atLeastOnce()).save(any(Department.class));
        
        // 2. Verify roles and permissions are saved
        verify(roleRepository, times(3)).save(any(Role.class)); // SUPER_ADMIN, DEPARTMENT_ADMIN, USER
        verify(permissionRepository, atLeast(15)).save(any(Permission.class));
        verify(rolePermissionRepository, atLeast(20)).save(any(RolePermission.class));

        // 3. Verify positions are saved (8 global + 40 department-specific)
        verify(positionRepository, times(48)).save(any(Position.class));

        // 4. Verify Super Admin and department users are created (41 users in total)
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(41)).save(userCaptor.capture());
        
        User admin = userCaptor.getAllValues().get(0);
        assertEquals("admin", admin.getUsername());
        assertEquals("Quản trị hệ thống", admin.getFullName());
        assertEquals("admin@paperless.gov.vn", admin.getEmail());
        assertEquals("0900000000", admin.getPhone());
        assertEquals("hashed_password", admin.getPassword());
        assertEquals(UserStatus.ACTIVE, admin.getStatus());
        assertTrue(admin.getIsFirstLogin());
        
        // Verify role is SUPER_ADMIN
        assertNotNull(admin.getRole());
        assertEquals("SUPER_ADMIN", admin.getRole().getRoleCode());

        // Verify position is CHU_TICH
        assertNotNull(admin.getPosition());
        assertEquals("CHU_TICH", admin.getPosition().getPositionCode());
        assertEquals(PositionRole.CHAIRMAN_CITY, admin.getPosition().getPositionRole());

        // Verify department is root
        assertNotNull(admin.getDepartment());
        assertEquals("UBND thành phố Hải Phòng", admin.getDepartment().getDeptName());
    }

    @Test
    void run_whenDataAlreadyExists_shouldNotDuplicate() {
        // Setup existing role and admin user to simulate second startup
        Role existingRole = new Role();
        existingRole.setId(UUID.randomUUID());
        existingRole.setRoleCode("SUPER_ADMIN");
        existingRole.setRoleName("Quản trị hệ thống");

        User existingUser = new User();
        existingUser.setId(UUID.randomUUID());
        existingUser.setUsername("admin");
        existingUser.setRole(existingRole);
        existingUser.setStatus(UserStatus.ACTIVE);

        reset(userRepository);
        lenient().when(userRepository.findByUsername("admin")).thenReturn(Optional.of(existingUser));
        lenient().when(roleRepository.findAll()).thenReturn(Collections.singletonList(existingRole));

        // Run
        systemInitializer.run();

        // Verify save was not called for admin user creation again since status/role matches
        verify(userRepository, never()).save(argThat(user -> "admin".equals(user.getUsername())));
    }
}
