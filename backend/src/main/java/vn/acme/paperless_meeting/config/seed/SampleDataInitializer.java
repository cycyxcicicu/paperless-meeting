package vn.acme.paperless_meeting.config.seed;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.Permission;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.RolePermission;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.LocationType;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.LocationRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.PermissionRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;
import vn.acme.paperless_meeting.repository.RolePermissionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true")
public class SampleDataInitializer implements CommandLineRunner {
    static final String DEFAULT_PASSWORD = "12345678";
    static final String ROOT_DEPARTMENT = "UBND thành phố Hải Phòng";
    static final String CENTRAL_SLUG = "vpubnd";
    static final LocalDateTime ROLE_ASSIGNMENT_AT = LocalDateTime.of(2026, 4, 1, 8, 0);
    static final LocalDateTime MEETING_REFERENCE_DATE = LocalDateTime.of(2026, 4, 7, 9, 0);

    static final List<DepartmentBlueprint> DEPARTMENT_BLUEPRINTS = List.of(
            new DepartmentBlueprint(
                    "Văn phòng UBND thành phố",
                    "vpubnd",
                    "điều hành liên thông",
                    List.of(
                            "Phòng Tổng hợp",
                            "Phòng Hành chính - Tổ chức",
                            "Phòng Hành chính - Quản trị",
                            "Phòng Nội chính - Pháp chế")),
            new DepartmentBlueprint(
                    "Thanh tra thành phố",
                    "thanhtra",
                    "giải quyết khiếu nại, tố cáo",
                    List.of(
                            "Văn phòng Thanh tra",
                            "Phòng Tiếp công dân",
                            "Phòng Giải quyết khiếu nại, tố cáo số 1",
                            "Phòng Giải quyết khiếu nại, tố cáo số 2")),
            new DepartmentBlueprint(
                    "Ban Quản lý Khu kinh tế Hải Phòng",
                    "bqlkkt",
                    "khu kinh tế",
                    List.of(
                            "Văn phòng Ban",
                            "Phòng Quản lý đầu tư",
                            "Phòng Quản lý doanh nghiệp",
                            "Phòng Quản lý hạ tầng")),
            new DepartmentBlueprint(
                    "Sở Nội vụ",
                    "sonv",
                    "cải cách hành chính",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Tổ chức cán bộ",
                            "Phòng Cải cách hành chính",
                            "Phòng Xây dựng chính quyền và Công tác thanh niên")),
            new DepartmentBlueprint(
                    "Sở Tài chính",
                    "sotc",
                    "ngân sách",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Ngân sách",
                            "Phòng Quản lý giá",
                            "Phòng Quản lý đầu tư tài chính")),
            new DepartmentBlueprint(
                    "Sở Xây dựng",
                    "soxd",
                    "quy hoạch xây dựng",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Quy hoạch - Kiến trúc",
                            "Phòng Hạ tầng kỹ thuật",
                            "Phòng Quản lý nhà và thị trường bất động sản")),
            new DepartmentBlueprint(
                    "Sở Giáo dục và Đào tạo",
                    "sogddt",
                    "giáo dục",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Giáo dục Mầm non",
                            "Phòng Giáo dục Phổ thông",
                            "Phòng Kế hoạch - Tài chính")),
            new DepartmentBlueprint(
                    "Sở Y tế",
                    "soyt",
                    "y tế",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Nghiệp vụ Y",
                            "Phòng Nghiệp vụ Dược",
                            "Phòng Kế hoạch - Tài chính")),
            new DepartmentBlueprint(
                    "Sở Công Thương",
                    "soct",
                    "công thương",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Quản lý công nghiệp",
                            "Phòng Quản lý thương mại",
                            "Phòng Kỹ thuật an toàn - Môi trường")),
            new DepartmentBlueprint(
                    "Sở Tư pháp",
                    "sotp",
                    "tư pháp",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Hành chính tư pháp",
                            "Phòng Phổ biến, giáo dục pháp luật",
                            "Phòng Bổ trợ tư pháp")),
            new DepartmentBlueprint(
                    "Sở Văn hóa, Thể thao và Du lịch",
                    "sovhttdl",
                    "văn hóa, thể thao và du lịch",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Quản lý văn hóa",
                            "Phòng Quản lý thể dục thể thao",
                            "Phòng Quản lý du lịch")),
            new DepartmentBlueprint(
                    "Sở Khoa học và Công nghệ",
                    "sokhcn",
                    "khoa học và công nghệ",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Quản lý khoa học",
                            "Phòng Quản lý công nghệ và đổi mới sáng tạo",
                            "Phòng Tiêu chuẩn - Đo lường - Chất lượng")),
            new DepartmentBlueprint(
                    "Sở Nông nghiệp và Môi trường",
                    "sonnmt",
                    "nông nghiệp và môi trường",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Trồng trọt và Bảo vệ thực vật",
                            "Phòng Chăn nuôi và Thú y",
                            "Phòng Quản lý đất đai và tài nguyên nước")),
            new DepartmentBlueprint(
                    "Sở Ngoại vụ",
                    "songoaivu",
                    "đối ngoại",
                    List.of(
                            "Văn phòng Sở",
                            "Phòng Hợp tác quốc tế",
                            "Phòng Lãnh sự và Phiên dịch",
                            "Phòng Quản lý biên giới")));

    DepartmentRepository departmentRepository;
    PositionRepository positionRepository;
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RolePermissionRepository rolePermissionRepository;
    UserRepository userRepository;
    LocationRepository locationRepository;
    MeetingRepository meetingRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, Department> departmentByPath = ensureDepartments();
        Map<String, Position> positionByCode = ensurePositions(departmentByPath);

        Map<String, Role> roleByName = ensureRoles();
        Map<String, Permission> permissionByCode = ensurePermissions();
        ensureRolePermissions(roleByName, permissionByCode);

        Map<String, User> userByUsername = ensureUsers(departmentByPath, positionByCode);
        ensureRoleAssignments(roleByName, userByUsername);

        Map<String, Location> locationByCode = ensureLocations();
        List<MeetingSeed> meetingSeeds = buildMeetingSeeds();
        Map<String, Meeting> meetingByTitle = ensureMeetings(meetingSeeds, userByUsername, departmentByPath,
                locationByCode);
        ensureMeetingParticipants(meetingSeeds, meetingByTitle, userByUsername);
    }

    private Map<String, Department> ensureDepartments() {
        List<DepartmentSeed> seeds = buildDepartmentSeeds();
        List<Department> existing = departmentRepository.findAll();
        Map<String, Department> pathToDepartment = new LinkedHashMap<>();

        for (DepartmentSeed seed : seeds) {
            Department parent = seed.parentPath() == null ? null : pathToDepartment.get(seed.parentPath());
            Department department = findDepartmentByNameAndParent(existing, seed.name(), parent);
            if (department == null) {
                department = new Department();
                department.setDeptName(seed.name());
                department.setParentDepartment(parent);
                department.setCode(deriveDepartmentCode(seed));
                department.setStatus(DepartmentStatus.ACTIVE);
                department = departmentRepository.save(department);
                existing.add(department);
            } else {
                // Ensure existing departments have non-null code/status when possible
                boolean changed = false;
                if (department.getCode() == null) {
                    department.setCode(deriveDepartmentCode(seed));
                    changed = true;
                }
                if (department.getStatus() == null) {
                    department.setStatus(DepartmentStatus.ACTIVE);
                    changed = true;
                }
                if (changed) {
                    department = departmentRepository.save(department);
                }
            }
            pathToDepartment.put(seed.path(), department);
        }

        return pathToDepartment;
    }

    private String deriveDepartmentCode(DepartmentSeed seed) {
        // If this seed matches a top-level blueprint, use its slug
        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            if (blueprint.topLevelPath().equals(seed.path())) {
                return blueprint.slug();
            }
        }

        // If parent matches a top-level blueprint, prefix child code with parent slug
        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            if (blueprint.topLevelPath().equals(seed.parentPath())) {
                return blueprint.slug() + "-" + slugify(seed.name());
            }
        }

        // Fallback: slugify the department name
        return slugify(seed.name());
    }

    private String slugify(String input) {
        if (input == null) {
            return java.util.UUID.randomUUID().toString();
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutDiacritics = normalized.replaceAll("\\p{M}", "");
        String slug = withoutDiacritics.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (slug.isBlank()) {
            return java.util.UUID.randomUUID().toString().substring(0, 8);
        }
        return slug;
    }

    private List<DepartmentSeed> buildDepartmentSeeds() {
        List<DepartmentSeed> seeds = new ArrayList<>();
        seeds.add(new DepartmentSeed(ROOT_DEPARTMENT, null));

        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            String topLevelPath = blueprint.topLevelPath();
            seeds.add(new DepartmentSeed(topLevelPath, ROOT_DEPARTMENT));

            for (String childUnit : blueprint.childUnits()) {
                seeds.add(new DepartmentSeed(blueprint.childPath(childUnit), topLevelPath));
            }
        }

        return seeds;
    }

    private Department findDepartmentByNameAndParent(List<Department> departments, String departmentName,
            Department parentDepartment) {
        for (Department department : departments) {
            if (!departmentName.equals(department.getDeptName())) {
                continue;
            }

            Department currentParent = department.getParentDepartment();
            if (parentDepartment == null) {
                if (currentParent == null) {
                    return department;
                }
                continue;
            }

            if (currentParent != null && parentDepartment.getId() != null
                    && parentDepartment.getId().equals(currentParent.getId())) {
                return department;
            }
        }

        return null;
    }

    private Map<String, Position> ensurePositions(Map<String, Department> departmentByPath) {
        Map<String, Position> existingByCode = indexBy(positionRepository.findAll(), Position::getPositionCode);
        Map<String, Position> result = new LinkedHashMap<>();

        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            Department department = requireDepartment(departmentByPath, blueprint.topLevelPath());

            for (PositionSeed seed : buildPositionSeeds(blueprint)) {
                Position position = existingByCode.get(seed.code());
                if (position == null) {
                    position = new Position();
                    position.setCreatedAt(ROLE_ASSIGNMENT_AT);
                }

                position.setPositionCode(seed.code());
                position.setPositionName(seed.name());
                position.setDescription(seed.description());
                position.setRankOrder(seed.rankOrder());
                position.setIsLeadership(seed.isLeadership());
                position.setDepartment(department);
                position.setUpdatedAt(ROLE_ASSIGNMENT_AT);
                position.setIsDeleted(false);

                Position saved = positionRepository.save(position);
                existingByCode.put(seed.code(), saved);
                result.put(seed.code(), saved);
            }
        }

        return result;
    }

    private List<PositionSeed> buildPositionSeeds(DepartmentBlueprint blueprint) {
        return List.of(
                new PositionSeed(
                        blueprint.positionCode("lead"),
                        "Trưởng đơn vị",
                        "Vị trí lãnh đạo cao nhất của " + blueprint.name(),
                        1,
                        true),
                new PositionSeed(
                        blueprint.positionCode("deputy"),
                        "Phó trưởng đơn vị",
                        "Hỗ trợ điều hành mảng " + blueprint.focusLabel(),
                        2,
                        true),
                new PositionSeed(
                        blueprint.positionCode("coordinator"),
                        "Tổ trưởng chuyên môn",
                        "Điều phối nghiệp vụ " + blueprint.focusLabel(),
                        3,
                        true),
                new PositionSeed(
                        blueprint.positionCode("specialist"),
                        "Chuyên viên",
                        "Chuyên viên phụ trách " + blueprint.focusLabel(),
                        4,
                        false));
    }

    private Map<String, Role> ensureRoles() {
        List<String> roleNames = List.of("SUPER_ADMIN", "DEPARTMENT_ADMIN", "USER");
        Map<String, Role> existingByName = indexBy(roleRepository.findAll(), role -> role.getRoleName().toUpperCase());
        Map<String, Role> result = new LinkedHashMap<>();

        for (String roleName : roleNames) {
            Role role = existingByName.get(roleName);
            if (role == null) {
                role = new Role();
            }

            role.setRoleName(roleName);
            role = roleRepository.save(role);
            existingByName.put(roleName, role);
            result.put(roleName, role);
        }

        return result;
    }

    private Map<String, Permission> ensurePermissions() {
        List<PermissionSeed> seeds = List.of(
                // User-related
                new PermissionSeed("PROFILE_UPDATE_SELF", "User can update own profile"),
                new PermissionSeed("USER_VIEW_DEPARTMENT", "View users in own department"),
                new PermissionSeed("USER_MANAGE_DEPARTMENT", "Manage users in own department"),
                new PermissionSeed("USER_VIEW_ALL", "View users across system"),
                new PermissionSeed("USER_MANAGE_ALL", "Manage users across system"),

                // Meeting-related (new granular codes)
                new PermissionSeed("MEETING_CREATE", "Create meeting in allowed department"),
                new PermissionSeed("MEETING_VIEW_OWN", "View meetings the user created"),
                new PermissionSeed("MEETING_MANAGE_OWN", "Manage meetings the user created"),
                new PermissionSeed("MEETING_VIEW_DEPARTMENT", "View meetings in department"),
                new PermissionSeed("MEETING_MANAGE_DEPARTMENT", "Manage meetings in department"),
                new PermissionSeed("MEETING_VIEW_ALL", "View all meetings"),
                new PermissionSeed("MEETING_MANAGE_ALL", "Manage all meetings"),

                // Location
                new PermissionSeed("LOCATION_VIEW_DEPARTMENT", "View locations in department"),
                new PermissionSeed("LOCATION_MANAGE_DEPARTMENT", "Manage locations in department"),
                new PermissionSeed("LOCATION_VIEW_ALL", "View locations across system"),
                new PermissionSeed("LOCATION_MANAGE_ALL", "Manage locations across system"),

                // Report
                new PermissionSeed("REPORT_VIEW_DEPARTMENT", "View reports in department"),
                new PermissionSeed("REPORT_VIEW_ALL", "View reports across system"),

                // Backwards-compat / legacy permissions used across code
                new PermissionSeed("MEETING_VIEW", "Legacy: view meeting"),
                new PermissionSeed("MEETING_UPDATE", "Legacy: update meeting"),
                new PermissionSeed("MEETING_CANCEL", "Legacy: cancel meeting"),
                new PermissionSeed("PARTICIPANT_MANAGE", "Manage meeting participants"),
                new PermissionSeed("AGENDA_MANAGE", "Manage agenda items"),

                // RBAC maintenance
                new PermissionSeed("MANAGE_ROLE_ASSIGNMENTS", "Assign and revoke user-role links"),
                new PermissionSeed("VIEW_ROLE_ASSIGNMENTS", "View user-role links"));

        Map<String, Permission> existingByCode = indexBy(permissionRepository.findAll(),
                permission -> permission.getPermCode().toUpperCase());
        Map<String, Permission> result = new LinkedHashMap<>();

        for (PermissionSeed seed : seeds) {
            Permission permission = existingByCode.get(seed.code());
            if (permission == null) {
                permission = new Permission();
            }

            permission.setPermCode(seed.code());
            permission.setDescription(seed.description());
            permission = permissionRepository.save(permission);
            existingByCode.put(seed.code(), permission);
            result.put(seed.code(), permission);
        }

        return result;
    }

    private void ensureRolePermissions(Map<String, Role> roleByName, Map<String, Permission> permissionByCode) {
        // Build role -> permission mapping according to new RBAC matrix.
        Set<String> allCodes = new LinkedHashSet<>(permissionByCode.keySet());

        Map<String, Set<String>> matrix = new LinkedHashMap<>();

        // SUPER_ADMIN: all permissions
        matrix.put("SUPER_ADMIN", allCodes);

        // DEPARTMENT_ADMIN: department-level management permissions (plus legacy
        // meeting management codes for compatibility)
        matrix.put("DEPARTMENT_ADMIN", Set.of(
                "PROFILE_UPDATE_SELF",
                "USER_VIEW_DEPARTMENT",
                "USER_MANAGE_DEPARTMENT",
                "MEETING_CREATE",
                "MEETING_VIEW_DEPARTMENT",
                "MEETING_MANAGE_DEPARTMENT",
                "LOCATION_VIEW_DEPARTMENT",
                "LOCATION_MANAGE_DEPARTMENT",
                "REPORT_VIEW_DEPARTMENT",
                // Compatibility
                "MEETING_VIEW",
                "MEETING_UPDATE",
                "PARTICIPANT_MANAGE"));

        // Regular USER: personal profile + own meeting actions
        matrix.put("USER", Set.of(
                "PROFILE_UPDATE_SELF",
                "MEETING_VIEW_OWN",
                "MEETING_MANAGE_OWN",
                // Compatibility
                "MEETING_VIEW"));

        for (Map.Entry<String, Set<String>> entry : matrix.entrySet()) {
            Role role = roleByName.get(entry.getKey());
            if (role == null) {
                throw new IllegalStateException("Missing role seed: " + entry.getKey());
            }

            Set<String> assignedCodes = rolePermissionRepository.findPermissionCodesByRoleId(role.getId());
            for (String code : entry.getValue()) {
                if (assignedCodes.contains(code)) {
                    continue;
                }

                Permission permission = permissionByCode.get(code);
                if (permission == null) {
                    throw new IllegalStateException("Missing permission seed: " + code);
                }

                RolePermission rolePermission = new RolePermission();
                rolePermission.setRole(role);
                rolePermission.setPermission(permission);
                rolePermissionRepository.save(rolePermission);
            }
        }
    }

    

    private Map<String, User> ensureUsers(Map<String, Department> departmentByPath,
            Map<String, Position> positionByCode) {
        Map<String, User> existingByUsername = indexBy(userRepository.findAll(), User::getUsername);
        Map<String, User> result = new LinkedHashMap<>();

        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            for (UserSeed seed : buildRosterSeeds(blueprint)) {
                User saved = upsertUser(seed, existingByUsername, positionByCode);
                ensurePrimaryDepartment(saved, seed.primaryDepartmentPath(), departmentByPath);
                result.put(saved.getUsername(), saved);
            }
        }

        UserSeed globalCreatorSeed = buildGlobalCreatorSeed();
        User globalCreator = upsertUser(globalCreatorSeed, existingByUsername, positionByCode);
        ensurePrimaryDepartment(globalCreator, globalCreatorSeed.primaryDepartmentPath(), departmentByPath);
        result.put(globalCreator.getUsername(), globalCreator);

        return result;
    }

    private List<UserSeed> buildRosterSeeds(DepartmentBlueprint blueprint) {
        List<UserSeed> seeds = new ArrayList<>();
        seeds.add(buildAdminSeed(blueprint));
        seeds.add(buildCreatorSeed(blueprint, 1));
        seeds.add(buildCreatorSeed(blueprint, 2));

        for (int staffIndex = 1; staffIndex <= 12; staffIndex++) {
            seeds.add(buildStaffSeed(blueprint, staffIndex));
        }

        return seeds;
    }

    private UserSeed buildAdminSeed(DepartmentBlueprint blueprint) {
        String username = blueprint.adminUsername();
        String fullName = blueprint.isCentralOffice()
                ? "Quản trị hệ thống UBND thành phố Hải Phòng"
                : "Thủ trưởng " + blueprint.name();
        return new UserSeed(
                username,
                fullName,
                username + "@paperless.local",
                blueprint.isCentralOffice() ? "0999000001" : buildPhoneNumber(blueprint.departmentIndex(), 1, 1),
                blueprint.topLevelPath(),
                blueprint.positionCode("lead"));
    }

    private UserSeed buildCreatorSeed(DepartmentBlueprint blueprint, int creatorIndex) {
        String username = blueprint.creatorUsername(creatorIndex);
        String fullName = creatorIndex == 1
                ? "Phó phụ trách " + blueprint.focusLabel() + " 01 - " + blueprint.name()
                : "Tổ trưởng " + blueprint.focusLabel() + " 02 - " + blueprint.name();
        String positionCode = creatorIndex == 1 ? blueprint.positionCode("deputy")
                : blueprint.positionCode("coordinator");

        return new UserSeed(
                username,
                fullName,
                username + "@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 2, creatorIndex),
                blueprint.topLevelPath(),
                positionCode);
    }

    private UserSeed buildStaffSeed(DepartmentBlueprint blueprint, int staffIndex) {
        String username = blueprint.staffUsername(staffIndex);
        String childUnit = blueprint.childUnits().get((staffIndex - 1) % blueprint.childUnits().size());
        String fullName = "Chuyên viên " + childUnit + " " + String.format("%02d", staffIndex) + " - "
                + blueprint.name();

        return new UserSeed(
                username,
                fullName,
                username + "@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 3, staffIndex),
                blueprint.topLevelPath(),
                blueprint.positionCode("specialist"));
    }

    private UserSeed buildGlobalCreatorSeed() {
        DepartmentBlueprint blueprint = blueprintBySlug(CENTRAL_SLUG);
        return new UserSeed(
                "global.creator",
                "Điều phối liên sở - Văn phòng UBND thành phố",
                "global.creator@paperless.local",
                "0999000002",
                blueprint.topLevelPath(),
                blueprint.positionCode("coordinator"));
    }

    private User upsertUser(UserSeed seed,
            Map<String, User> existingByUsername,
            Map<String, Position> positionByCode) {
        User user = existingByUsername.get(seed.username());
        if (user == null) {
            user = new User();
        }

        Position position = requirePosition(positionByCode, seed.positionCode());

        user.setUsername(seed.username());
        user.setFullName(seed.fullName());
        user.setEmail(seed.email());
        user.setPhone(seed.phone());
        user.setStatus(UserStatus.ACTIVE);
        user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        user.setPosition(position);

        User saved = userRepository.save(user);
        existingByUsername.put(seed.username(), saved);
        return saved;
    }

    private void ensurePrimaryDepartment(User user, String primaryDepartmentPath,
            Map<String, Department> departmentByPath) {
        Department primaryDepartment = requireDepartment(departmentByPath, primaryDepartmentPath);
        user.setDepartment(primaryDepartment);
        userRepository.save(user);
    }

    private void ensureRoleAssignments(Map<String, Role> roleByName,
            Map<String, User> userByUsername) {
        Role superAdminRole = requireRole(roleByName, "SUPER_ADMIN");
        Role departmentAdminRole = requireRole(roleByName, "DEPARTMENT_ADMIN");
        Role userRole = requireRole(roleByName, "USER");

        User adminHp = requireUser(userByUsername, "admin.hp");
        User globalCreator = requireUser(userByUsername, "global.creator");

        assignRoleToUser(adminHp, superAdminRole);
        assignRoleToUser(globalCreator, departmentAdminRole);

        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            User adminUser = requireUser(userByUsername, blueprint.adminUsername());
            User creator1 = requireUser(userByUsername, blueprint.creatorUsername(1));
            User creator2 = requireUser(userByUsername, blueprint.creatorUsername(2));

            // admin.hp keeps SUPER_ADMIN in 1-n role model; other unit admins get DEPARTMENT_ADMIN
            if (!adminHp.getId().equals(adminUser.getId())) {
                assignRoleToUser(adminUser, departmentAdminRole);
            }

            // Creators are regular users
            assignRoleToUser(creator1, userRole);
            assignRoleToUser(creator2, userRole);

            for (int staffIndex = 1; staffIndex <= 12; staffIndex++) {
                User staff = requireUser(userByUsername, blueprint.staffUsername(staffIndex));
                assignRoleToUser(staff, userRole);
            }
        }
    }

    private void assignRoleToUser(User user, Role role) {
        if (user == null || role == null) {
            throw new IllegalStateException("Cannot assign role with missing data");
        }
        if (user.getRole() != null && user.getRole().getId().equals(role.getId())) {
            return;
        }
        user.setRole(role);
        userRepository.save(user);
    }

    private Map<String, Location> ensureLocations() {
        Map<String, Location> existingByRoomCode = indexBy(locationRepository.findAll(), Location::getRoomCode);
        Map<String, Location> result = new LinkedHashMap<>();

        for (LocationSeed seed : buildLocationSeeds()) {
            Location location = existingByRoomCode.get(seed.roomCode());
            if (location == null) {
                location = new Location();
            }

            location.setName(seed.name());
            location.setAddress(seed.address());
            location.setRoomCode(seed.roomCode());
            location.setOnlineLink(seed.onlineLink());
            location.setType(seed.type());

            Location saved = locationRepository.save(location);
            existingByRoomCode.put(seed.roomCode(), saved);
            result.put(seed.roomCode(), saved);
        }

        return result;
    }

    private List<LocationSeed> buildLocationSeeds() {
        List<LocationSeed> seeds = new ArrayList<>();

        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            String officeAddress = "Trụ sở " + blueprint.name() + ", Hải Phòng";
            seeds.add(new LocationSeed(
                    blueprint.locationCode("office"),
                    "Phòng họp chuyên đề - " + blueprint.name(),
                    officeAddress,
                    null,
                    LocationType.OFFLINE));
            seeds.add(new LocationSeed(
                    blueprint.locationCode("hall"),
                    "Hội trường - " + blueprint.name(),
                    officeAddress,
                    null,
                    LocationType.OFFLINE));
            seeds.add(new LocationSeed(
                    blueprint.locationCode("online"),
                    "Phòng họp trực tuyến - " + blueprint.name(),
                    null,
                    "https://meet.hp.local/" + blueprint.slug() + "/online",
                    LocationType.ONLINE));
            seeds.add(new LocationSeed(
                    blueprint.locationCode("hybrid"),
                    "Phòng họp kết hợp - " + blueprint.name(),
                    officeAddress,
                    "https://meet.hp.local/" + blueprint.slug() + "/hybrid",
                    LocationType.HYBRID));
        }

        return seeds;
    }

    private List<MeetingSeed> buildMeetingSeeds() {
        List<MeetingSeed> seeds = new ArrayList<>();

        for (int i = 0; i < DEPARTMENT_BLUEPRINTS.size(); i++) {
            DepartmentBlueprint blueprint = DEPARTMENT_BLUEPRINTS.get(i);
            int departmentIndex = i + 1;
            seeds.add(buildDraftMeetingSeed(blueprint, departmentIndex));
            seeds.add(buildOperationalMeetingSeed(blueprint, departmentIndex));
            seeds.add(buildReviewMeetingSeed(blueprint, departmentIndex));
            seeds.add(buildInterDepartmentalMeetingSeed(blueprint, departmentIndex));
        }

        return seeds;
    }

    private MeetingSeed buildDraftMeetingSeed(DepartmentBlueprint blueprint, int departmentIndex) {
        LocalDateTime startTime = meetingDate(departmentIndex * 4L, 8, 30);
        return new MeetingSeed(
                departmentIndex,
                blueprint.slug(),
                blueprint.name(),
                blueprint.focusLabel(),
                "Dự thảo kế hoạch " + blueprint.focusLabel() + " - " + blueprint.name(),
                "Chuẩn bị nội dung và phân công đầu mối cho " + blueprint.focusLabel() + ".",
                startTime,
                startTime.plusMinutes(90),
                startTime.minusMinutes(20),
                startTime.plusMinutes(15),
                10,
                MeetingStatus.DRAFT,
                null,
                blueprint.adminUsername(),
                blueprint.topLevelPath(),
                blueprint.locationCode("office"),
                MeetingScenario.INTERNAL_DRAFT);
    }

    private MeetingSeed buildOperationalMeetingSeed(DepartmentBlueprint blueprint, int departmentIndex) {
        LocalDateTime startTime = meetingDate(departmentIndex * 4L + 1, 10, 0);
        return new MeetingSeed(
                departmentIndex,
                blueprint.slug(),
                blueprint.name(),
                blueprint.focusLabel(),
                "Giao ban " + blueprint.focusLabel() + " định kỳ - " + blueprint.name(),
                "Rà soát tiến độ triển khai nhiệm vụ " + blueprint.focusLabel() + " của " + blueprint.name() + ".",
                startTime,
                startTime.plusMinutes(120),
                startTime.minusMinutes(20),
                startTime.plusMinutes(15),
                10,
                MeetingStatus.SCHEDULED,
                null,
                blueprint.creatorUsername(1),
                blueprint.topLevelPath(),
                blueprint.locationCode("hall"),
                MeetingScenario.INTERNAL_OPERATIONAL);
    }

    private MeetingSeed buildReviewMeetingSeed(DepartmentBlueprint blueprint, int departmentIndex) {
        MeetingStatus status = departmentIndex % 2 == 0 ? MeetingStatus.CLOSED : MeetingStatus.ONGOING;
        LocalDateTime startTime = status == MeetingStatus.ONGOING
                ? MEETING_REFERENCE_DATE.minusMinutes(30).plusMinutes(departmentIndex * 3L)
                : MEETING_REFERENCE_DATE.minusDays(7L + departmentIndex).withHour(13).withMinute(30).withSecond(0)
                        .withNano(0);

        return new MeetingSeed(
                departmentIndex,
                blueprint.slug(),
                blueprint.name(),
                blueprint.focusLabel(),
                "Tổng kết " + blueprint.focusLabel() + " quý II - " + blueprint.name(),
                "Đánh giá kết quả và kiến nghị điều chỉnh cho " + blueprint.focusLabel() + ".",
                startTime,
                startTime.plusMinutes(90),
                startTime.minusMinutes(20),
                startTime.plusMinutes(15),
                10,
                status,
                null,
                blueprint.creatorUsername(2),
                blueprint.topLevelPath(),
                blueprint.locationCode("online"),
                MeetingScenario.INTERNAL_REVIEW);
    }

    private MeetingSeed buildInterDepartmentalMeetingSeed(DepartmentBlueprint blueprint, int departmentIndex) {
        MeetingStatus status = departmentIndex % 4 == 0 ? MeetingStatus.CANCELLED : MeetingStatus.SCHEDULED;
        LocalDateTime startTime = meetingDate(20L + departmentIndex, 15, 0);
        return new MeetingSeed(
                departmentIndex,
                blueprint.slug(),
                blueprint.name(),
                blueprint.focusLabel(),
                "Điều phối liên ngành về " + blueprint.focusLabel() + " - " + blueprint.name(),
                "Phối hợp các đơn vị để xử lý nhóm nhiệm vụ " + blueprint.focusLabel() + ".",
                startTime,
                startTime.plusMinutes(120),
                startTime.minusMinutes(20),
                startTime.plusMinutes(15),
                10,
                status,
                status == MeetingStatus.CANCELLED ? "Điều chỉnh lịch làm việc liên ngành" : null,
                "global.creator",
                blueprint.topLevelPath(),
                blueprint.locationCode("hybrid"),
                MeetingScenario.INTERDEPARTMENTAL);
    }

    private Map<String, Meeting> ensureMeetings(List<MeetingSeed> meetingSeeds,
            Map<String, User> userByUsername,
            Map<String, Department> departmentByPath,
            Map<String, Location> locationByCode) {
        Map<String, Meeting> existingByTitle = indexBy(meetingRepository.findAll(), Meeting::getTitle);
        Map<String, Meeting> result = new LinkedHashMap<>();

        for (MeetingSeed seed : meetingSeeds) {
            Meeting meeting = existingByTitle.get(seed.title());
            if (meeting == null) {
                meeting = new Meeting();
            }

            meeting.setTitle(seed.title());
            meeting.setDescription(seed.description());
            meeting.setStartTime(seed.startTime());
            meeting.setEndTime(seed.endTime());
            meeting.setCheckinOpenAt(seed.checkinOpenAt());
            meeting.setCheckinCloseAt(seed.checkinCloseAt());
            meeting.setLateAfterMinutes(seed.lateAfterMinutes());
            meeting.setStatus(seed.status());
            meeting.setCancelReason(seed.cancelReason());
            meeting.setDeleteReason(null);
            meeting.setCreatedBy(requireUser(userByUsername, seed.creatorUsername()));
            meeting.setDepartment(requireDepartment(departmentByPath, seed.departmentPath()));
            meeting.setLocation(requireLocation(locationByCode, seed.locationCode()));

            Meeting saved = meetingRepository.save(meeting);
            existingByTitle.put(seed.title(), saved);
            result.put(seed.title(), saved);
        }

        return result;
    }

    

    private void ensureMeetingParticipants(List<MeetingSeed> meetingSeeds,
            Map<String, Meeting> meetingByTitle,
            Map<String, User> userByUsername) {
        Map<String, MeetingParticipant> existingByKey = indexBy(
                meetingParticipantRepository.findAll(),
                participant -> participantKey(participant.getMeeting().getId(), participant.getUser().getId()));

        for (MeetingSeed seed : meetingSeeds) {
            Meeting meeting = requireMeeting(meetingByTitle, seed.title());
            DepartmentBlueprint blueprint = blueprintBySlug(seed.departmentSlug());
            List<ParticipantSeed> participantSeeds = buildParticipantSeeds(seed, blueprint);

            for (ParticipantSeed participantSeed : participantSeeds) {
                User user = requireUser(userByUsername, participantSeed.username());
                ensureParticipant(meeting, user, participantSeed, existingByKey);
            }
        }
    }

    private List<ParticipantSeed> buildParticipantSeeds(MeetingSeed seed, DepartmentBlueprint blueprint) {
        return switch (seed.scenario()) {
            case INTERNAL_DRAFT -> buildDraftParticipants(blueprint);
            case INTERNAL_OPERATIONAL -> buildOperationalParticipants(blueprint);
            case INTERNAL_REVIEW -> buildReviewParticipants(seed, blueprint);
            case INTERDEPARTMENTAL -> buildInterDepartmentalParticipants(seed, blueprint);
        };
    }

    private List<ParticipantSeed> buildDraftParticipants(DepartmentBlueprint blueprint) {
        return List.of(
                participant(blueprint.adminUsername(), ParticipantRole.CHAIR, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Chủ trì soạn thảo"),
                participant(blueprint.creatorUsername(1), ParticipantRole.SECRETARY, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Thư ký chuẩn bị"),
                participant(blueprint.creatorUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Phối hợp nội dung"),
                participant(blueprint.staffUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.PENDING,
                        AttendanceStatus.NOT_CHECKED_IN, "Đầu mối chuyên môn 1"),
                participant(blueprint.staffUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.PENDING,
                        AttendanceStatus.NOT_CHECKED_IN, "Đầu mối chuyên môn 2"));
    }

    private List<ParticipantSeed> buildOperationalParticipants(DepartmentBlueprint blueprint) {
        return List.of(
                participant(blueprint.creatorUsername(1), ParticipantRole.CHAIR, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Chủ trì giao ban"),
                participant(blueprint.creatorUsername(2), ParticipantRole.SECRETARY, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Thư ký giao ban"),
                participant(blueprint.adminUsername(), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Lãnh đạo theo dõi"),
                participant(blueprint.staffUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Báo cáo tiến độ 1"),
                participant(blueprint.staffUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.PENDING,
                        AttendanceStatus.NOT_CHECKED_IN, "Báo cáo tiến độ 2"),
                participant(blueprint.staffUsername(3), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Báo cáo tiến độ 3"),
                participant(blueprint.staffUsername(4), ParticipantRole.PARTICIPANT, InviteStatus.PENDING,
                        AttendanceStatus.NOT_CHECKED_IN, "Báo cáo tiến độ 4"));
    }

    private List<ParticipantSeed> buildReviewParticipants(MeetingSeed seed, DepartmentBlueprint blueprint) {
        boolean ongoing = seed.status() == MeetingStatus.ONGOING;
        AttendanceStatus chairStatus = AttendanceStatus.PRESENT;
        AttendanceStatus secretaryStatus = AttendanceStatus.PRESENT;
        AttendanceStatus participantStatus = ongoing ? AttendanceStatus.NOT_CHECKED_IN : AttendanceStatus.PRESENT;

        return List.of(
                participant(blueprint.creatorUsername(2), ParticipantRole.CHAIR, InviteStatus.ACCEPTED, chairStatus,
                        "Chủ trì tổng kết"),
                participant(blueprint.adminUsername(), ParticipantRole.SECRETARY, InviteStatus.ACCEPTED,
                        secretaryStatus,
                        "Thư ký tổng hợp"),
                participant(blueprint.creatorUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        participantStatus, "Đầu mối phụ trách"),
                participant(blueprint.staffUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.PRESENT, "Thành viên chuyên môn 1"),
                participant(blueprint.staffUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.ABSENT, "Thành viên chuyên môn 2"),
                participant(blueprint.staffUsername(3), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        ongoing ? AttendanceStatus.NOT_CHECKED_IN : AttendanceStatus.ABSENT,
                        "Thành viên chuyên môn 3"));
    }

    private List<ParticipantSeed> buildInterDepartmentalParticipants(MeetingSeed seed, DepartmentBlueprint blueprint) {
        DepartmentBlueprint next1 = blueprintAtOffset(seed.departmentIndex(), 1);
        DepartmentBlueprint next2 = blueprintAtOffset(seed.departmentIndex(), 2);
        DepartmentBlueprint next3 = blueprintAtOffset(seed.departmentIndex(), 3);
        DepartmentBlueprint next4 = blueprintAtOffset(seed.departmentIndex(), 4);
        boolean cancelled = seed.status() == MeetingStatus.CANCELLED;

        return List.of(
                participant("global.creator", ParticipantRole.CHAIR, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Điều phối liên ngành"),
                participant(blueprint.creatorUsername(1), ParticipantRole.SECRETARY, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Thư ký liên ngành"),
                participant(blueprint.creatorUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Đầu mối của đơn vị chủ trì"),
                participant(blueprint.staffUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Thành viên đơn vị chủ trì"),
                participant(next1.staffUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Đại diện đơn vị phối hợp 1"),
                participant(next2.creatorUsername(1), ParticipantRole.PARTICIPANT,
                        cancelled ? InviteStatus.PENDING : InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Đầu mối đơn vị phối hợp 2"),
                participant(next3.staffUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Đại diện đơn vị phối hợp 3"),
                participant(next4.staffUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.DECLINED,
                        AttendanceStatus.ABSENT, "Từ chối tham dự"),
                participant(next4.staffUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                        AttendanceStatus.NOT_CHECKED_IN, "Đại diện đơn vị phối hợp 4"));
    }

    private void ensureParticipant(Meeting meeting,
            User user,
            ParticipantSeed seed,
            Map<String, MeetingParticipant> existingByKey) {
        String key = participantKey(meeting.getId(), user.getId());
        MeetingParticipant participant = existingByKey.get(key);
        if (participant == null) {
            participant = new MeetingParticipant();
        }

        participant.setMeeting(meeting);
        participant.setUser(user);
        participant.setParticipantRole(seed.participantRole());
        participant.setInviteStatus(seed.inviteStatus());
        participant.setAttendanceStatus(seed.attendanceStatus());
        participant.setNote(seed.note());

        MeetingParticipant saved = meetingParticipantRepository.save(participant);
        existingByKey.put(key, saved);
    }

    private Department requireDepartment(Map<String, Department> departmentByPath, String path) {
        Department department = departmentByPath.get(path);
        if (department == null) {
            throw new IllegalStateException("Missing department seed for path: " + path);
        }
        return department;
    }

    private Position requirePosition(Map<String, Position> positionByCode, String positionCode) {
        Position position = positionByCode.get(positionCode);
        if (position == null) {
            throw new IllegalStateException("Missing position seed for code: " + positionCode);
        }
        return position;
    }

    private Role requireRole(Map<String, Role> roleByName, String roleName) {
        Role role = roleByName.get(roleName);
        if (role == null) {
            throw new IllegalStateException("Missing role seed: " + roleName);
        }
        return role;
    }


    private User requireUser(Map<String, User> userByUsername, String username) {
        User user = userByUsername.get(username);
        if (user == null) {
            throw new IllegalStateException("Missing user seed: " + username);
        }
        return user;
    }

    private Location requireLocation(Map<String, Location> locationByCode, String locationCode) {
        Location location = locationByCode.get(locationCode);
        if (location == null) {
            throw new IllegalStateException("Missing location seed: " + locationCode);
        }
        return location;
    }

    private Meeting requireMeeting(Map<String, Meeting> meetingByTitle, String title) {
        Meeting meeting = meetingByTitle.get(title);
        if (meeting == null) {
            throw new IllegalStateException("Missing meeting seed: " + title);
        }
        return meeting;
    }

    private DepartmentBlueprint blueprintBySlug(String slug) {
        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            if (blueprint.slug().equals(slug)) {
                return blueprint;
            }
        }

        throw new IllegalStateException("Missing department blueprint for slug: " + slug);
    }

    private DepartmentBlueprint blueprintAtOffset(int departmentIndex, int offset) {
        int index = (departmentIndex - 1 + offset) % DEPARTMENT_BLUEPRINTS.size();
        return DEPARTMENT_BLUEPRINTS.get(index);
    }

    private List<String> topLevelDepartmentPaths() {
        return DEPARTMENT_BLUEPRINTS.stream()
                .map(DepartmentBlueprint::topLevelPath)
                .toList();
    }

    private <T> Map<String, T> indexBy(Collection<T> items, Function<T, String> keyExtractor) {
        Map<String, T> result = new LinkedHashMap<>();
        for (T item : items) {
            String key = keyExtractor.apply(item);
            if (key != null) {
                result.put(key, item);
            }
        }
        return result;
    }

    // userDepartmentKey removed: multi-department assignment model deprecated (n-1
    // mapping)

    private String participantKey(java.util.UUID meetingId, java.util.UUID userId) {
        return meetingId + "::" + userId;
    }

    private String buildPhoneNumber(int departmentIndex, int roleGroup, int sequence) {
        return String.format("0900%02d%02d%02d", departmentIndex, roleGroup, sequence);
    }

    private LocalDateTime meetingDate(long daysOffset, int hour, int minute) {
        return MEETING_REFERENCE_DATE.plusDays(daysOffset)
                .withHour(hour)
                .withMinute(minute)
                .withSecond(0)
                .withNano(0);
    }

    private ParticipantSeed participant(String username,
            ParticipantRole participantRole,
            InviteStatus inviteStatus,
            AttendanceStatus attendanceStatus,
            String note) {
        return new ParticipantSeed(username, participantRole, inviteStatus, attendanceStatus, note);
    }

    private record DepartmentSeed(String path, String parentPath) {
        private String name() {
            int idx = path.lastIndexOf('/');
            return idx < 0 ? path : path.substring(idx + 1);
        }
    }

    private record PositionSeed(
            String code,
            String name,
            String description,
            Integer rankOrder,
            Boolean isLeadership) {
    }

    private record PermissionSeed(String code, String description) {
    }

    private record UserSeed(
            String username,
            String fullName,
            String email,
            String phone,
            String primaryDepartmentPath,
            String positionCode) {
    }

    private record LocationSeed(
            String roomCode,
            String name,
            String address,
            String onlineLink,
            LocationType type) {
    }

    private record MeetingSeed(
            int departmentIndex,
            String departmentSlug,
            String departmentName,
            String focusLabel,
            String title,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            LocalDateTime checkinOpenAt,
            LocalDateTime checkinCloseAt,
            Integer lateAfterMinutes,
            MeetingStatus status,
            String cancelReason,
            String creatorUsername,
            String departmentPath,
            String locationCode,
            MeetingScenario scenario) {
    }

    private record ParticipantSeed(
            String username,
            ParticipantRole participantRole,
            InviteStatus inviteStatus,
            AttendanceStatus attendanceStatus,
            String note) {
    }

    private record DepartmentBlueprint(
            String name,
            String slug,
            String focusLabel,
            List<String> childUnits) {

        private String topLevelPath() {
            return ROOT_DEPARTMENT + "/" + name;
        }

        private String childPath(String childUnit) {
            return topLevelPath() + "/" + childUnit;
        }

        private String adminUsername() {
            return isCentralOffice() ? "admin.hp" : "admin." + slug;
        }

        private String creatorUsername(int index) {
            return "creator." + slug + "." + String.format("%02d", index);
        }

        private String staffUsername(int index) {
            return "user." + slug + "." + String.format("%02d", index);
        }

        private String positionCode(String suffix) {
            return slug + "-" + suffix;
        }

        private String locationCode(String suffix) {
            return slug + "-" + suffix;
        }

        private boolean isCentralOffice() {
            return CENTRAL_SLUG.equals(slug);
        }

        private int departmentIndex() {
            for (int i = 0; i < DEPARTMENT_BLUEPRINTS.size(); i++) {
                if (DEPARTMENT_BLUEPRINTS.get(i).slug().equals(slug)) {
                    return i + 1;
                }
            }

            throw new IllegalStateException("Missing blueprint index for slug: " + slug);
        }
    }

    private enum MeetingScenario {
        INTERNAL_DRAFT,
        INTERNAL_OPERATIONAL,
        INTERNAL_REVIEW,
        INTERDEPARTMENTAL
    }
}
