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
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.PositionRole;
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
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.MotionRepository;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Motion;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.entity.enums.MotionStatus;
import org.springframework.jdbc.core.JdbcTemplate;

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
    AgendaItemRepository agendaItemRepository;
    MotionRepository motionRepository;
    JdbcTemplate jdbcTemplate;
    PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        clearAllMeetingData();

        List<Department> existingDepts = departmentRepository.findAll();
        Department sonvDept = existingDepts.stream()
                .filter(d -> "sonv".equals(d.getCode()))
                .findFirst()
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setDeptName("Sở Nội vụ");
                    d.setCode("sonv");
                    d.setStatus(DepartmentStatus.ACTIVE);
                    d.setDescription("Sở Nội vụ");
                    return departmentRepository.save(d);
                });

        Map<String, Department> departmentByPath = new LinkedHashMap<>();
        departmentByPath.put("UBND thành phố Hải Phòng/Sở Nội vụ", sonvDept);
        departmentByPath.put("sonv", sonvDept);
        for (Department d : existingDepts) {
            departmentByPath.put(getDepartmentPath(d), d);
            if (d.getCode() != null) {
                departmentByPath.put(d.getCode(), d);
            }
        }

        List<Location> existingLocs = locationRepository.findAll();
        Map<String, Location> locationByCode = new LinkedHashMap<>();
        for (Location loc : existingLocs) {
            if (loc.getRoomCode() != null) {
                locationByCode.put(loc.getRoomCode(), loc);
            }
        }

        String[] roomCodes = {"sonv-office", "sonv-online", "sonv-hall", "sonv-hybrid"};
        String[] roomNames = {"Phòng họp chuyên đề - Sở Nội vụ", "Phòng họp trực tuyến - Sở Nội vụ", "Hội trường - Sở Nội vụ", "Phòng họp kết hợp - Sở Nội vụ"};
        for (int i = 0; i < roomCodes.length; i++) {
            String code = roomCodes[i];
            String name = roomNames[i];
            if (!locationByCode.containsKey(code)) {
                Location loc = new Location();
                loc.setRoomCode(code);
                loc.setName(name);
                loc.setIsActive(true);
                loc.setCapacity(50);
                loc.setDepartment(sonvDept);
                loc = locationRepository.save(loc);
                locationByCode.put(code, loc);
            }
        }

        List<User> existingUsers = userRepository.findAll();
        Map<String, User> userByUsername = new LinkedHashMap<>();
        for (User u : existingUsers) {
            userByUsername.put(u.getUsername(), u);
        }

        String[] usernames = {"sonv.spec0_3", "admin.sonv", "sonv.manager0", "sonv.manager1", "sonv.spec0_1", "sonv.spec0_2"};
        String[] fullNames = {"Đỗ Thị Minh", "Sái Thị Yến", "Phạm Minh Huân", "Trần Văn Nam", "Lê Hồng Sơn", "Nguyễn Văn Hợp"};
        for (int i = 0; i < usernames.length; i++) {
            String username = usernames[i];
            String fullName = fullNames[i];
            if (!userByUsername.containsKey(username)) {
                User u = new User();
                u.setUsername(username);
                u.setFullName(fullName);
                u.setEmail(username + "@paperless.local");
                u.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
                u.setStatus(UserStatus.ACTIVE);
                u.setDepartment(sonvDept);
                u = userRepository.save(u);
                userByUsername.put(username, u);
            }
        }

        List<MeetingSeed> meetingSeeds = buildMeetingSeeds();
        Map<String, Meeting> meetingByTitle = ensureMeetings(meetingSeeds, userByUsername, departmentByPath,
                locationByCode);
        ensureMeetingParticipants(meetingSeeds, meetingByTitle, userByUsername);
        ensureAgendasAndMotions(meetingSeeds, meetingByTitle, userByUsername);
    }

    private String getDepartmentPath(Department dept) {
        if (dept == null) {
            return "";
        }
        if (dept.getParentDepartment() == null) {
            return dept.getDeptName();
        }
        return getDepartmentPath(dept.getParentDepartment()) + "/" + dept.getDeptName();
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
                department.setDescription("Mô tả mặc định cho " + seed.name());
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

        // 1. Tạo các Chức vụ hệ thống (Department = null)
        List<PositionSeed> globalSeeds = List.of(
            new PositionSeed("CHU_TICH", "Chủ tịch UBND", "Đứng đầu thành phố", 1, true, PositionRole.CHAIRMAN_CITY),
            new PositionSeed("PHO_CHU_TICH", "Phó Chủ tịch UBND", "Cấp phó thành phố", 2, true, PositionRole.VICE_CHAIRMAN_CITY),
            new PositionSeed("GIAM_DOC", "Giám đốc / Chánh văn phòng", "Thủ trưởng đơn vị", 10, true, PositionRole.HEAD_OF_DEPARTMENT_LEVEL),
            new PositionSeed("PHO_GIAM_DOC", "Phó Giám đốc / Phó chánh văn phòng", "Cấp phó", 11, true, PositionRole.DEPUTY_OF_DEPARTMENT_LEVEL),
            new PositionSeed("TRUONG_PHONG", "Trưởng phòng", "Lãnh đạo phòng ban", 15, true, PositionRole.HEAD_OF_DIVISION),
            new PositionSeed("PHO_TRUONG_PHONG", "Phó Trưởng phòng", "Phó phòng ban", 16, true, PositionRole.DEPUTY_OF_DIVISION),
            new PositionSeed("THU_KY", "Thư ký", "Thư ký / Văn phòng", 19, false, PositionRole.SPECIALIST),
            new PositionSeed("CHUYEN_VIEN", "Chuyên viên", "Cán bộ chuyên môn", 20, false, PositionRole.SPECIALIST)
        );

        for (PositionSeed seed : globalSeeds) {
            Position saved = upsertPosition(seed, null, existingByCode);
            result.put(seed.code(), saved);
        }

        // 2. Tạo chức vụ đặc thù cấp Đơn vị (Department != null)
        for (Department department : departmentByPath.values()) {
            boolean isTopLevel = department.getParentDepartment() == null || ROOT_DEPARTMENT.equals(department.getParentDepartment().getDeptName());
            if (isTopLevel && !ROOT_DEPARTMENT.equals(department.getDeptName())) {
                String deptCode = department.getCode();
                if (deptCode != null) {
                    String specCode = deptCode + "_spec_custom";
                    String specName = getCustomPositionName(deptCode);
                    List<PositionSeed> unitSpecificSeeds = List.of(
                        new PositionSeed(specCode, specName, "Chức vụ đặc thù cho đơn vị " + department.getDeptName(), 18, false, PositionRole.SPECIALIST)
                    );
                    for (PositionSeed seed : unitSpecificSeeds) {
                        Position saved = upsertPosition(seed, department, existingByCode);
                        result.put(seed.code(), saved);
                    }
                }
            }
        }
        
        return result;
    }

    private String getCustomPositionName(String slug) {
        return switch (slug) {
            case "vpubnd" -> "Chuyên viên Tổng hợp Văn phòng";
            case "thanhtra" -> "Thanh tra viên";
            case "bqlkkt" -> "Chuyên viên quản lý đầu tư";
            case "sonv" -> "Chuyên viên Tổ chức cán bộ";
            case "sotc" -> "Kiểm soát viên ngân sách";
            case "soxd" -> "Kỹ sư quy hoạch xây dựng";
            case "sogddt" -> "Thanh tra viên giáo dục";
            case "soyt" -> "Bác sĩ chính";
            case "soct" -> "Chuyên viên quản lý năng lượng";
            case "sotp" -> "Công chứng viên";
            case "sovhttdl" -> "Chuyên viên quản lý du lịch";
            case "sokhcn" -> "Chuyên viên quản lý công nghệ";
            case "sonnmt" -> "Chuyên viên bảo vệ thực vật";
            case "songoaivu" -> "Phiên dịch viên đối ngoại";
            default -> "Chuyên viên chuyên môn đặc thù";
        };
    }

    private Position upsertPosition(PositionSeed seed, Department department, Map<String, Position> existingByCode) {
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
        position.setPositionRole(seed.positionRole());
        position.setDepartment(department);
        position.setUpdatedAt(ROLE_ASSIGNMENT_AT);
        position.setIsDeleted(false);

        Position saved = positionRepository.save(position);
        existingByCode.put(seed.code(), saved);
        return saved;
    }

    private Map<String, Role> ensureRoles() {
        Map<String, String> roleMap = new LinkedHashMap<>();
        roleMap.put("SUPER_ADMIN", "Quản trị hệ thống");
        roleMap.put("DEPARTMENT_ADMIN", "Quản trị đơn vị");
        roleMap.put("USER", "Người dùng hệ thống");

        Map<String, Role> existingByCode = indexBy(roleRepository.findAll(), role -> role.getRoleCode() != null ? role.getRoleCode().toUpperCase() : "");
        Map<String, Role> result = new LinkedHashMap<>();

        for (Map.Entry<String, String> entry : roleMap.entrySet()) {
            String roleCode = entry.getKey();
            String roleName = entry.getValue();

            Role role = existingByCode.get(roleCode);
            if (role == null) {
                role = new Role();
            }

            role.setRoleCode(roleCode);
            role.setRoleName(roleName);
            role = roleRepository.save(role);
            existingByCode.put(roleCode, role);
            result.put(roleCode, role);
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

    private void ensureRolePermissions(Map<String, Role> roleByCode, Map<String, Permission> permissionByCode) {
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
                "MEETING_CREATE",
                "MEETING_VIEW_OWN",
                "MEETING_MANAGE_OWN",
                // Compatibility
                "MEETING_VIEW"));

        for (Map.Entry<String, Set<String>> entry : matrix.entrySet()) {
            Role role = roleByCode.get(entry.getKey());
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

    private static class RealPersonnel {
        final String adminName;
        final String pgdName;
        final String manager0Name;
        final String manager1Name;
        final String spec1Name;
        final String spec2Name;
        final String spec3Name;

        RealPersonnel(String adminName, String pgdName, String manager0Name, String manager1Name, String spec1Name, String spec2Name, String spec3Name) {
            this.adminName = adminName;
            this.pgdName = pgdName;
            this.manager0Name = manager0Name;
            this.manager1Name = manager1Name;
            this.spec1Name = spec1Name;
            this.spec2Name = spec2Name;
            this.spec3Name = spec3Name;
        }
    }

    private static final Map<String, RealPersonnel> REAL_ROSTER = Map.ofEntries(
        Map.entry("vpubnd", new RealPersonnel("Đỗ Thành Trung", "Lê Anh Quân", "Nguyễn Hoàng Long", "Trần Văn Thiện", "Nguyễn Thanh Hùng", "Phạm Anh Tuấn", "Phạm Huy Hoàng")),
        Map.entry("thanhtra", new RealPersonnel("Trần Việt Tuấn", "Bùi Hùng Thiện", "Vũ Anh Thư", "Phạm Văn Hùng", "Lê Văn Sơn", "Nguyễn Thị Mai", "Trần Văn Hải")),
        Map.entry("bqlkkt", new RealPersonnel("Phạm Văn Thép", "Bùi Ngọc Hải", "Nguyễn Công Hân", "Nguyễn Văn Thành", "Hoàng Văn Dương", "Trịnh Thị Hương", "Vũ Văn Bình")),
        Map.entry("sonv", new RealPersonnel("Sái Thị Yến", "Nguyễn Thị Thu", "Phạm Minh Huân", "Trần Văn Nam", "Lê Hồng Sơn", "Nguyễn Văn Hợp", "Đỗ Thị Minh")),
        Map.entry("sotc", new RealPersonnel("Nguyễn Ngọc Tú", "Trần Văn Lâm", "Nguyễn Thị Huệ", "Lê Hoàng Anh", "Phạm Quang Vinh", "Vũ Hồng Dương", "Đỗ Thu Hà")),
        Map.entry("soxd", new RealPersonnel("Nguyễn Thành Hưng", "Đỗ Quý Tiến", "Vũ Hữu Thành", "Trần Văn Thắng", "Phạm Minh Đức", "Nguyễn Thị Vân", "Lê Hoàng Nam")),
        Map.entry("sogddt", new RealPersonnel("Lương Văn Việt", "Bùi Văn Kiệm", "Phạm Quốc Hiệu", "Nguyễn Thị Hải", "Vũ Văn Lương", "Trần Tuấn Anh", "Nguyễn Thị Lan")),
        Map.entry("soyt", new RealPersonnel("Lê Minh Quang", "Trần Anh Cường", "Nguyễn Tiến Sơn", "Phạm Quang Hải", "Hoàng Thị Hoa", "Nguyễn Văn Đạt", "Bùi Thị Mai")),
        Map.entry("soct", new RealPersonnel("Nguyễn Văn Thành", "Vũ Lạc Huy", "Lê Minh Sơn", "Trần Việt Dũng", "Phạm Văn Nam", "Đỗ Thị Quỳnh", "Vũ Quốc Việt")),
        Map.entry("sotp", new RealPersonnel("Ngô Quang Giáp", "Bùi Văn Nam", "Lê Anh Tuấn", "Nguyễn Văn Hùng", "Trần Thị Hòa", "Lê Minh Đức", "Nguyễn Thị Thu Hà")),
        Map.entry("sovhttdl", new RealPersonnel("Nguyễn Thành Trung", "Đỗ Quốc Anh", "Phạm Văn Tuấn", "Vũ Thị Hằng", "Lê Văn Tiến", "Trần Thu Trang", "Nguyễn Văn Hòa")),
        Map.entry("sokhcn", new RealPersonnel("Nguyễn Cao Thắng", "Phạm Văn Thọ", "Trần Văn Hải", "Lê Thị Lan", "Nguyễn Văn Đạt", "Vũ Hoàng Sơn", "Phạm Thị Thảo")),
        Map.entry("sonnmt", new RealPersonnel("Bùi Văn Thăng", "Lê Văn Cường", "Phạm Văn Giang", "Nguyễn Thị Hằng", "Trần Văn Đạt", "Vũ Anh Tuấn", "Nguyễn Thị Hương")),
        Map.entry("songoaivu", new RealPersonnel("Trần Thị Quỳnh Trang", "Nguyễn Hoàng Dương", "Trần Văn Khánh", "Vũ Thị Hồng", "Lê Minh Tuấn", "Nguyễn Thị Dung", "Phạm Văn An"))
    );

    private List<UserSeed> buildRosterSeeds(DepartmentBlueprint blueprint) {
        List<UserSeed> seeds = new ArrayList<>();
        String topCode = blueprint.slug();
        String topPath = blueprint.topLevelPath();
        RealPersonnel roster = REAL_ROSTER.get(topCode);
        if (roster == null) {
            throw new IllegalStateException("Missing real roster for slug: " + topCode);
        }

        // 1. Admin/Thủ trưởng
        seeds.add(new UserSeed(
                blueprint.adminUsername(),
                roster.adminName,
                blueprint.adminUsername() + "@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 1, 1),
                topPath,
                blueprint.isCentralOffice() ? "CHU_TICH" : "GIAM_DOC"
        ));

        // 2. Phó Thủ trưởng
        seeds.add(new UserSeed(
                topCode + ".pgd1",
                roster.pgdName,
                topCode + ".pgd1@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 2, 1),
                topPath,
                blueprint.isCentralOffice() ? "PHO_CHU_TICH" : "PHO_GIAM_DOC"
        ));

        // 3. Trưởng phòng 0 (child unit 0)
        String childPath0 = blueprint.childPath(blueprint.childUnits().get(0));
        seeds.add(new UserSeed(
                topCode + ".manager0",
                roster.manager0Name,
                topCode + ".manager0@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 3, 1),
                childPath0,
                "TRUONG_PHONG"
        ));

        // 4. Trưởng phòng 1 (child unit 1)
        String childPath1 = blueprint.childPath(blueprint.childUnits().get(1));
        seeds.add(new UserSeed(
                topCode + ".manager1",
                roster.manager1Name,
                topCode + ".manager1@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 3, 2),
                childPath1,
                "TRUONG_PHONG"
        ));

        // 5. Chuyên viên 1 - Chức vụ đặc thù (child unit 0)
        seeds.add(new UserSeed(
                topCode + ".spec0_1",
                roster.spec1Name,
                topCode + ".spec0_1@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 5, 1),
                childPath0,
                topCode + "_spec_custom"
        ));

        // 6. Chuyên viên 2 (child unit 0)
        seeds.add(new UserSeed(
                topCode + ".spec0_2",
                roster.spec2Name,
                topCode + ".spec0_2@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 5, 2),
                childPath0,
                "CHUYEN_VIEN"
        ));

        // 7. Thư ký / Chuyên viên 3 (child unit 0)
        seeds.add(new UserSeed(
                topCode + ".spec0_3",
                roster.spec3Name,
                topCode + ".spec0_3@paperless.local",
                buildPhoneNumber(blueprint.departmentIndex(), 5, 3),
                childPath0,
                "THU_KY"
        ));

        return seeds;
    }

    private UserSeed buildGlobalCreatorSeed() {
        DepartmentBlueprint blueprint = blueprintBySlug(CENTRAL_SLUG);
        return new UserSeed(
                "global.creator",
                "Điều phối liên sở - Văn phòng UBND thành phố",
                "global.creator@paperless.local",
                "0999000002",
                blueprint.topLevelPath(),
                "THU_KY");
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
        user.setIsFirstLogin(true);
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

    private void ensureRoleAssignments(Map<String, Role> roleByCode,
            Map<String, User> userByUsername) {
        Role superAdminRole = requireRole(roleByCode, "SUPER_ADMIN");
        Role departmentAdminRole = requireRole(roleByCode, "DEPARTMENT_ADMIN");
        Role userRole = requireRole(roleByCode, "USER");

        User adminHp = requireUser(userByUsername, "admin.hp");
        User globalCreator = requireUser(userByUsername, "global.creator");

        assignRoleToUser(adminHp, superAdminRole);
        assignRoleToUser(globalCreator, departmentAdminRole);

        for (User user : userByUsername.values()) {
            if (user.getId().equals(adminHp.getId()) || user.getId().equals(globalCreator.getId())) {
                continue;
            }
            if (user.getPosition() != null && 
                (user.getPosition().getPositionRole() == PositionRole.CHAIRMAN_CITY || 
                 user.getPosition().getPositionRole() == PositionRole.HEAD_OF_DEPARTMENT_LEVEL)) {
                assignRoleToUser(user, departmentAdminRole);
            } else {
                assignRoleToUser(user, userRole);
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

    private Map<String, Location> ensureLocations(Map<String, Department> departmentByPath) {
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
            location.setIsActive(seed.isActive());
            location.setCapacity(seed.capacity());

            if (seed.departmentPath() != null) {
                location.setDepartment(requireDepartment(departmentByPath, seed.departmentPath()));
            } else {
                location.setDepartment(null);
            }

            Location saved = locationRepository.save(location);
            existingByRoomCode.put(seed.roomCode(), saved);
            result.put(seed.roomCode(), saved);
        }

        return result;
    }

    private List<LocationSeed> buildLocationSeeds() {
        List<LocationSeed> seeds = new ArrayList<>();

        // Add some shared system-wide rooms (department == null)
        seeds.add(new LocationSeed("SYS-HALL-1", "Hội trường lớn UBND TP", "Trung tâm Hội nghị TP", true, 500, null));
        seeds.add(new LocationSeed("SYS-ROOM-2", "Phòng Khánh tiết", "Tòa nhà UBND TP, Tầng 2", true, 50, null));

        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            String officeAddress = "Trụ sở " + blueprint.name() + ", Hải Phòng";
            String departmentPath = blueprint.topLevelPath();
            seeds.add(new LocationSeed(
                    blueprint.locationCode("office"),
                    "Phòng họp chuyên đề - " + blueprint.name(),
                    officeAddress,
                    true,
                    20,
                    departmentPath));
            seeds.add(new LocationSeed(
                    blueprint.locationCode("hall"),
                    "Hội trường - " + blueprint.name(),
                    officeAddress,
                    true,
                    200,
                    departmentPath));
            seeds.add(new LocationSeed(
                    blueprint.locationCode("online"),
                    "Phòng họp trực tuyến - " + blueprint.name(),
                    null,
                    true,
                    100,
                    departmentPath));
            seeds.add(new LocationSeed(
                    blueprint.locationCode("hybrid"),
                    "Phòng họp kết hợp - " + blueprint.name(),
                    officeAddress,
                    true,
                    50,
                    departmentPath));
        }

        return seeds;
    }

    private List<MeetingSeed> buildMeetingSeeds() {
        List<MeetingSeed> seeds = new ArrayList<>();
        DepartmentBlueprint sonvBlueprint = null;
        for (DepartmentBlueprint bp : DEPARTMENT_BLUEPRINTS) {
            if ("sonv".equals(bp.slug())) {
                sonvBlueprint = bp;
                break;
            }
        }
        if (sonvBlueprint == null) {
            throw new IllegalStateException("Sở Nội vụ (sonv) blueprint not found!");
        }

        List<SonvMeetingTemplate> templates = getSonvMeetingTemplates();
        for (int i = 0; i < templates.size(); i++) {
            SonvMeetingTemplate t = templates.get(i);
            seeds.add(new MeetingSeed(
                    sonvBlueprint.departmentIndex(),
                    "sonv",
                    "Sở Nội vụ",
                    "cải cách hành chính",
                    t.title(),
                    t.content(),
                    "https://meet.hp.local/sonv/meeting-" + (i + 1),
                    t.startTime(),
                    t.startTime().plusMinutes(90),
                    10,
                    MeetingStatus.DRAFT,
                    null,
                    "sonv.spec0_3",
                    sonvBlueprint.topLevelPath(),
                    t.locationCode(),
                    MeetingScenario.INTERNAL_DRAFT
            ));
        }

        return seeds;
    }

    private record SonvMeetingTemplate(
            String title,
            String content,
            LocalDateTime startTime,
            String locationCode,
            List<String> agendas,
            List<String> motions) {
    }

    private List<SonvMeetingTemplate> getSonvMeetingTemplates() {
        return List.of(
            new SonvMeetingTemplate(
                "Đánh giá chỉ số cải cách hành chính (PAR Index) năm 2025",
                "Đánh giá, xếp hạng chỉ số cải cách hành chính năm 2025 của các sở, ban, ngành và UBND các quận, huyện trên địa bàn thành phố Hải Phòng.",
                LocalDateTime.of(2026, 7, 1, 14, 0),
                "sonv-office",
                List.of("Báo cáo tổng hợp kết quả thẩm định PAR Index năm 2025", "Thảo luận và thống nhất điểm số tự đánh giá của các đơn vị"),
                List.of("Thông qua báo cáo xếp hạng chỉ số cải cách hành chính PAR Index 2025")
            ),
            new SonvMeetingTemplate(
                "Đánh giá tiến độ số hóa hồ sơ thủ tục hành chính tại Bộ phận Một cửa",
                "Kiểm điểm tiến độ triển khai số hóa hồ sơ, kết quả giải quyết thủ tục hành chính tại bộ phận một cửa các cấp.",
                LocalDateTime.of(2026, 7, 3, 9, 0),
                "sonv-online",
                List.of("Báo cáo tỷ lệ số hóa hồ sơ thủ tục hành chính tháng 6/2026", "Giải pháp khắc phục tồn tại đối với các đơn vị có tỷ lệ số hóa thấp"),
                List.of("Thống nhất chỉ tiêu số hóa hồ sơ bắt buộc tối thiểu 90% đối với các phòng chuyên môn")
            ),
            new SonvMeetingTemplate(
                "Triển khai kế hoạch tuyển dụng công chức thành phố năm 2026",
                "Xây dựng chỉ tiêu, phương án và phân công nhiệm vụ chuẩn bị cho kỳ thi tuyển dụng công chức thành phố Hải Phòng năm 2026.",
                LocalDateTime.of(2026, 7, 6, 8, 30),
                "sonv-hall",
                List.of("Dự thảo Kế hoạch thi tuyển công chức thành phố năm 2026", "Phương án thành lập Hội đồng thi tuyển và Ban Giám sát"),
                List.of("Thông qua kế hoạch chi tiết kỳ thi tuyển dụng công chức năm 2026")
            ),
            new SonvMeetingTemplate(
                "Xét duyệt hồ sơ tiếp nhận công chức từ các tỉnh, thành phố khác",
                "Thẩm định hồ sơ, năng lực và sự phù hợp đối với các trường hợp xin chuyển công tác về các cơ quan thuộc thành phố Hải Phòng.",
                LocalDateTime.of(2026, 7, 8, 14, 0),
                "sonv-office",
                List.of("Báo cáo thẩm định hồ sơ của 05 công chức đăng ký tiếp nhận", "Ý kiến đánh giá của các cơ quan tiếp nhận dự kiến"),
                List.of("Thông qua danh sách tiếp nhận công chức đợt 1 năm 2026")
            ),
            new SonvMeetingTemplate(
                "Họp Hội đồng tuyển dụng viên chức các đơn vị sự nghiệp công lập",
                "Thống nhất kế hoạch và quy chế xét tuyển viên chức cho các đơn vị sự nghiệp công lập trực thuộc sở.",
                LocalDateTime.of(2026, 7, 10, 9, 0),
                "sonv-hybrid",
                List.of("Báo cáo nhu cầu tuyển dụng viên chức của các đơn vị sự nghiệp", "Dự thảo thông báo tuyển dụng và quy chế xét tuyển"),
                List.of("Phê duyệt phương án xét tuyển viên chức sự nghiệp đợt II")
            ),
            new SonvMeetingTemplate(
                "Rà soát đề án vị trí việc làm các cơ quan hành chính thành phố",
                "Đánh giá thực trạng phê duyệt và triển khai đề án vị trí việc làm theo quy định mới của Bộ Nội vụ.",
                LocalDateTime.of(2026, 7, 14, 8, 30),
                "sonv-office",
                List.of("Báo cáo tổng hợp khó khăn vướng mắc trong xác định vị trí việc làm", "Đề xuất hướng dẫn bổ sung cho các quận, huyện"),
                List.of("Thông qua dự thảo văn bản hướng dẫn điều chỉnh đề án vị trí việc làm")
            ),
            new SonvMeetingTemplate(
                "Triển khai kế hoạch tinh giản biên chế đợt II năm 2026",
                "Xét duyệt danh sách cán bộ, công chức, viên chức thuộc diện tinh giản biên chế theo Nghị định số 29/2023/NĐ-CP.",
                LocalDateTime.of(2026, 7, 16, 14, 0),
                "sonv-office",
                List.of("Trình bày danh sách 15 trường hợp đề nghị tinh giản biên chế", "Thảo luận về chế độ chính sách và phương án bố trí thay thế"),
                List.of("Phê duyệt danh sách cán bộ thuộc diện tinh giản biên chế đợt II")
            ),
            new SonvMeetingTemplate(
                "Họp rà soát quy hoạch chức danh lãnh đạo, quản lý giai đoạn 2026 - 2031",
                "Bổ sung, điều chỉnh quy hoạch cán bộ lãnh đạo diện Ban Thường vụ Thành ủy quản lý và diện Sở quản lý.",
                LocalDateTime.of(2026, 7, 20, 9, 0),
                "sonv-hall",
                List.of("Quy trình rà soát quy hoạch cán bộ hàng năm", "Giới thiệu nhân sự mới bổ sung vào quy hoạch"),
                List.of("Thông qua danh sách quy hoạch chức danh Giám đốc, Phó Giám đốc Sở")
            ),
            new SonvMeetingTemplate(
                "Xét duyệt quy trình bổ nhiệm, bổ nhiệm lại cán bộ lãnh đạo cấp phòng",
                "Đánh giá tiêu chuẩn, điều kiện và thực hiện quy trình bổ nhiệm lại đối với các Trưởng phòng, Phó Trưởng phòng thuộc sở.",
                LocalDateTime.of(2026, 7, 22, 14, 0),
                "sonv-office",
                List.of("Báo cáo kết quả lấy phiếu tín nhiệm bổ nhiệm lại chức danh Trưởng phòng Tổ chức", "Ý kiến nhận xét của Chi ủy và Lãnh đạo sở"),
                List.of("Đồng ý bổ nhiệm lại chức danh Trưởng phòng Tổ chức cán bộ")
            ),
            new SonvMeetingTemplate(
                "Triển khai lớp bồi dưỡng kiến thức quản lý nhà nước ngạch chuyên viên chính",
                "Lập kế hoạch tổ chức lớp bồi dưỡng cho cán bộ quy hoạch và công chức đủ tiêu chuẩn dự thi nâng ngạch.",
                LocalDateTime.of(2026, 7, 24, 9, 0),
                "sonv-hybrid",
                List.of("Báo cáo danh sách học viên đăng ký tham gia lớp bồi dưỡng", "Phối hợp với Trường Chính trị Tô Hiệu về chương trình giảng dạy"),
                List.of("Phê duyệt kinh phí tổ chức lớp bồi dưỡng ngạch chuyên viên chính")
            ),
            new SonvMeetingTemplate(
                "Họp Hội đồng thi đua - khen thưởng Sở Nội vụ tháng 7/2026",
                "Đánh giá phong trào thi đua 6 tháng đầu năm và bình xét danh hiệu thi đua cho các tập thể, cá nhân thuộc sở.",
                LocalDateTime.of(2026, 7, 28, 8, 30),
                "sonv-office",
                List.of("Báo cáo thành tích thi đua 6 tháng đầu năm của các phòng ban", "Đề xuất khen thưởng đột xuất cho cá nhân có sáng kiến xuất sắc"),
                List.of("Quyết định tặng Giấy khen của Giám đốc Sở cho 03 tập thể xuất sắc")
            ),
            new SonvMeetingTemplate(
                "Xét duyệt hồ sơ đề nghị khen thưởng cấp Nhà nước cho các tập thể, cá nhân",
                "Thẩm định hồ sơ đề nghị tặng thưởng Huân chương, Bằng khen của Thủ tướng Chính phủ cho các đơn vị trên địa bàn thành phố Hải Phòng.",
                LocalDateTime.of(2026, 7, 30, 14, 0),
                "sonv-hall",
                List.of("Trình bày báo cáo thẩm định hồ sơ đề nghị khen thưởng cấp Nhà nước", "Bình chọn danh sách đề xuất gửi Ban Thi đua - Khen thưởng Trung ương"),
                List.of("Thông qua danh sách 05 tập thể đề nghị tặng Bằng khen của Thủ tướng")
            ),
            new SonvMeetingTemplate(
                "Họp bàn phương án sắp xếp, sáp nhập các đơn vị hành chính cấp xã",
                "Thống nhất lộ trình và phương án bố trí cán bộ dôi dư sau sáp nhập các xã, phường giai đoạn 2026 - 2028.",
                LocalDateTime.of(2026, 8, 3, 9, 0),
                "sonv-hybrid",
                List.of("Tiến độ lấy ý kiến cử tri về sáp nhập xã, phường", "Phương án giải quyết chế độ cho cán bộ, công chức dôi dư"),
                List.of("Thông qua đề án sắp xếp đơn vị hành chính cấp xã giai đoạn 1")
            ),
            new SonvMeetingTemplate(
                "Rà soát tổ chức bộ máy và nhân sự các ban quản lý dự án thành phố",
                "Đánh giá cơ cấu tổ chức, biên chế và đề xuất phương án tinh gọn bộ máy các ban quản lý dự án chuyên ngành.",
                LocalDateTime.of(2026, 8, 5, 14, 0),
                "sonv-office",
                List.of("Báo cáo hiện trạng nhân sự tại các Ban QLDA xây dựng, giao thông", "Đề xuất quy chế quản lý và luân chuyển cán bộ chủ chốt"),
                List.of("Thông qua phương án sáp nhập Ban QLDA Nông nghiệp vào Ban QLDA Dân dụng")
            ),
            new SonvMeetingTemplate(
                "Triển khai quy định mới về quản lý người giữ chức danh lãnh đạo doanh nghiệp nhà nước",
                "Phổ biến, quán triệt Nghị định của Chính phủ về đánh giá, bổ nhiệm, miễn nhiệm người đại diện phần vốn nhà nước tại doanh nghiệp.",
                LocalDateTime.of(2026, 8, 7, 9, 0),
                "sonv-online",
                List.of("Phổ biến các điểm mới trong quản lý người đại diện vốn nhà nước", "Lập kế hoạch rà soát chứng chỉ, tiêu chuẩn của người đại diện hiện tại"),
                List.of("Ban hành kế hoạch rà soát tiêu chuẩn người đại diện vốn nhà nước năm 2026")
            ),
            new SonvMeetingTemplate(
                "Họp Hội đồng kỷ luật cán bộ, công chức vi phạm quy chế công vụ",
                "Xem xét hành vi vi phạm, xác định trách nhiệm và đề xuất hình thức kỷ luật đối với công chức vi phạm đạo đức công vụ.",
                LocalDateTime.of(2026, 8, 11, 8, 30),
                "sonv-office",
                List.of("Báo cáo kết quả xác minh hành vi vi phạm của công chức X", "Tự kiểm điểm của công chức và ý kiến của Hội đồng"),
                List.of("Đề xuất hình thức kỷ luật Cảnh cáo đối với công chức vi phạm")
            ),
            new SonvMeetingTemplate(
                "Họp đánh giá kết quả thanh tra công vụ tại UBND quận Hồng Bàng",
                "Thông qua dự thảo Kết luận thanh tra về việc thực hiện nhiệm vụ, quyền hạn và kỷ luật lao động tại UBND quận Hồng Bàng.",
                LocalDateTime.of(2026, 8, 13, 14, 0),
                "sonv-office",
                List.of("Dự thảo Kết luận thanh tra công vụ tại UBND quận Hồng Bàng", "Ý kiến giải trình của đơn vị được thanh tra"),
                List.of("Thông qua dự thảo Kết luận thanh tra công vụ quận Hồng Bàng")
            ),
            new SonvMeetingTemplate(
                "Triển khai kế hoạch kiểm tra quy chế dân chủ tại các cơ quan hành chính",
                "Thành lập đoàn kiểm tra liên ngành và phân công lịch kiểm tra thực tế tại các sở, ngành, địa phương.",
                LocalDateTime.of(2026, 8, 17, 9, 0),
                "sonv-hybrid",
                List.of("Quyết định thành lập đoàn kiểm tra quy chế dân chủ năm 2026", "Đề cương báo cáo yêu cầu các đơn vị chuẩn bị"),
                List.of("Thông qua kế hoạch kiểm tra quy chế dân chủ tại 10 đơn vị điểm")
            ),
            new SonvMeetingTemplate(
                "Họp thống nhất phương án phân bổ biên chế công chức hành chính năm 2027",
                "Xác định chỉ tiêu biên chế công chức của từng sở, ngành, quận, huyện dựa trên vị trí việc làm và khối lượng công việc.",
                LocalDateTime.of(2026, 8, 19, 14, 0),
                "sonv-hall",
                List.of("Báo cáo đề xuất nhu cầu biên chế công chức của các cơ quan, đơn vị", "Phương án phân bổ chỉ tiêu biên chế năm 2027 trình Bộ Nội vụ"),
                List.of("Nhất trí phương án phân bổ tổng biên chế công chức hành chính Hải Phòng 2027")
            ),
            new SonvMeetingTemplate(
                "Rà soát công tác quản lý nhà nước về thanh niên và hội, tổ chức phi chính phủ",
                "Đánh giá hoạt động của các hội quần chúng và việc triển khai Chiến lược phát triển thanh niên Hải Phòng giai đoạn II.",
                LocalDateTime.of(2026, 8, 21, 9, 0),
                "sonv-office",
                List.of("Báo cáo hoạt động và đề xuất hỗ trợ kinh phí cho các hội đặc thù", "Tiến độ triển khai các đề án hỗ trợ thanh niên khởi nghiệp"),
                List.of("Quyết định công nhận điều lệ sửa đổi của Hội Cựu giáo chức thành phố")
            ),
            new SonvMeetingTemplate(
                "Triển khai thực hiện Nghị quyết của HĐND thành phố về chính sách thu hút nhân tài",
                "Xây dựng quy trình tiếp nhận, đãi ngộ và môi trường làm việc hỗ trợ cho các sinh viên tốt nghiệp xuất sắc, nhà khoa học trẻ.",
                LocalDateTime.of(2026, 8, 25, 14, 0),
                "sonv-hybrid",
                List.of("Dự thảo Hướng dẫn thực hiện chính sách thu hút, trọng dụng nhân tài", "Phương án bố trí công tác ban đầu cho các trường hợp thu hút đợt này"),
                List.of("Thông qua quy chế đãi ngộ cán bộ diện thu hút chất lượng cao")
            ),
            new SonvMeetingTemplate(
                "Họp thống nhất nội dung quy chế làm việc mới của Sở Nội vụ Hải Phòng",
                "Sửa đổi, bổ sung quy chế làm việc của sở nhằm phân định rõ trách nhiệm, quyền hạn và nâng cao kỷ cương hành chính.",
                LocalDateTime.of(2026, 8, 27, 8, 30),
                "sonv-office",
                List.of("Dự thảo Quy chế làm việc sửa đổi, bổ sung của Sở Nội vụ", "Ý kiến đóng góp của các phòng chuyên môn và tương đương"),
                List.of("Thông qua quy chế làm việc mới của Sở Nội vụ Hải Phòng")
            ),
            new SonvMeetingTemplate(
                "Họp tập huấn nghiệp vụ công tác văn thư, lưu trữ và bảo vệ bí mật nhà nước",
                "Thống nhất kế hoạch tổ chức lớp tập huấn nghiệp vụ quản lý tài liệu lưu trữ điện tử và bảo vệ bí mật nhà nước cho toàn sở.",
                LocalDateTime.of(2026, 8, 28, 14, 0),
                "sonv-hall",
                List.of("Kế hoạch tập huấn và phân công báo cáo viên", "Quy chế bảo vệ bí mật nhà nước trong soạn thảo tài liệu tại Sở"),
                List.of("Ban hành Quy chế bảo vệ bí mật nhà nước nội bộ")
            ),
            new SonvMeetingTemplate(
                "Xét duyệt đề án phát triển nguồn nhân lực chất lượng cao ngành y tế và giáo dục",
                "Thảo luận và thẩm định nội dung đề án nâng cao năng lực đội ngũ y bác sĩ, giáo viên thành phố Hải Phòng đến năm 2030.",
                LocalDateTime.of(2026, 8, 31, 9, 0),
                "sonv-hybrid",
                List.of("Đề án phát triển nhân lực chất lượng cao ngành Y tế", "Đề án phát triển nhân lực chất lượng cao ngành Giáo dục"),
                List.of("Nhất trí trình UBND thành phố phê duyệt Đề án phát triển nhân lực")
            ),
            new SonvMeetingTemplate(
                "Họp tổng kết phong trào thi đua 'Dân vận khéo' của Sở Nội vụ năm 2026",
                "Đánh giá các mô hình dân vận khéo tiêu biểu của cán bộ công chức sở trong việc giải quyết thủ tục hành chính.",
                LocalDateTime.of(2026, 8, 31, 14, 0),
                "sonv-office",
                List.of("Báo cáo tổng kết phong trào thi đua Dân vận khéo năm 2026", "Lựa chọn gương điển hình tiên tiến đề nghị thành phố khen thưởng"),
                List.of("Thông qua báo cáo tổng kết phong trào Dân vận khéo")
            )
        );
    }

    private void ensureAgendasAndMotions(List<MeetingSeed> meetingSeeds,
            Map<String, Meeting> meetingByTitle,
            Map<String, User> userByUsername) {
        for (MeetingSeed seed : meetingSeeds) {
            Meeting meeting = meetingByTitle.get(seed.title());
            if (meeting == null) continue;

            List<Motion> existingMotions = motionRepository.findByMeetingId(meeting.getId());
            if (!existingMotions.isEmpty()) {
                motionRepository.deleteAll(existingMotions);
            }
            List<AgendaItem> existingAgendas = agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meeting.getId());
            if (!existingAgendas.isEmpty()) {
                agendaItemRepository.deleteAll(existingAgendas);
            }

            SonvMeetingTemplate template = null;
            for (SonvMeetingTemplate t : getSonvMeetingTemplates()) {
                if (t.title().equals(seed.title())) {
                    template = t;
                    break;
                }
            }

            if (template == null) continue;

            List<AgendaItem> savedAgendas = new ArrayList<>();
            for (int i = 0; i < template.agendas().size(); i++) {
                String agendaTitle = template.agendas().get(i);
                AgendaItem agenda = new AgendaItem();
                agenda.setMeeting(meeting);
                agenda.setTitle(agendaTitle);
                agenda.setContent(seed.content() + " - Nội dung thảo luận chi tiết: " + agendaTitle);
                agenda.setOrderNo(i + 1);
                agenda.setDurationEst(45);
                agenda.setStatus(AgendaItemStatus.PENDING_PREPARATION);
                agenda.setPrepDeadline(seed.startTime().minusDays(1));
                agenda.setOwnerUser(requireUser(userByUsername, "admin.sonv"));
                agenda.setPreparedByUser(requireUser(userByUsername, "sonv.spec0_3"));
                agenda.setStartTime(seed.startTime().plusMinutes(i * 45L));
                agenda.setEndTime(seed.startTime().plusMinutes((i + 1) * 45L));
                savedAgendas.add(agendaItemRepository.save(agenda));
            }

            for (int i = 0; i < template.motions().size(); i++) {
                String motionTitle = template.motions().get(i);
                Motion motion = new Motion();
                motion.setMeeting(meeting);
                if (!savedAgendas.isEmpty()) {
                    motion.setAgendaItem(savedAgendas.get(0));
                }
                motion.setTitle(motionTitle);
                motion.setDescription("Nội dung biểu quyết thông qua: " + motionTitle);
                motion.setStatus(MotionStatus.DRAFT);
                motion.setCreatedBy(requireUser(userByUsername, "sonv.spec0_3"));
                motion.setCreatedAt(LocalDateTime.now());
                motionRepository.save(motion);
            }
        }
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
            meeting.setContent(seed.content());
            meeting.setOnlineLink(seed.onlineLink());
            meeting.setStartTime(seed.startTime());
            meeting.setEndTime(seed.endTime());
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
        if ("sonv".equals(blueprint.slug())) {
            return List.of(
                    participant(blueprint.adminUsername(), ParticipantRole.CHAIR, InviteStatus.ACCEPTED,
                            AttendanceStatus.NOT_CHECKED_IN, "Chủ trì soạn thảo"),
                    participant("sonv.spec0_3", ParticipantRole.SECRETARY, InviteStatus.ACCEPTED,
                            AttendanceStatus.NOT_CHECKED_IN, "Thư ký chuẩn bị"),
                    participant(blueprint.creatorUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                            AttendanceStatus.NOT_CHECKED_IN, "Thành viên hội đồng"),
                    participant(blueprint.creatorUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.ACCEPTED,
                            AttendanceStatus.NOT_CHECKED_IN, "Phối hợp nội dung"),
                    participant(blueprint.staffUsername(1), ParticipantRole.PARTICIPANT, InviteStatus.PENDING,
                            AttendanceStatus.NOT_CHECKED_IN, "Đầu mối chuyên môn 1"),
                    participant(blueprint.staffUsername(2), ParticipantRole.PARTICIPANT, InviteStatus.PENDING,
                            AttendanceStatus.NOT_CHECKED_IN, "Đầu mối chuyên môn 2"));
        }
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
                participant(blueprint.slug() + ".pgd1", ParticipantRole.PARTICIPANT, InviteStatus.PENDING,
                        AttendanceStatus.NOT_CHECKED_IN, "Lãnh đạo đơn vị phụ trách"));
    }

    private List<ParticipantSeed> buildReviewParticipants(MeetingSeed seed, DepartmentBlueprint blueprint) {
        boolean ongoing = seed.status() == MeetingStatus.IN_PROGRESS;
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
            Boolean isLeadership,
            PositionRole positionRole) {
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
            Boolean isActive,
            Integer capacity,
            String departmentPath) {
    }

    private record MeetingSeed(
            int departmentIndex,
            String departmentSlug,
            String departmentName,
            String focusLabel,
            String title,
            String content,
            String onlineLink,
            LocalDateTime startTime,
            LocalDateTime endTime,
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
            return slug + ".manager" + (index - 1);
        }

        private String staffUsername(int index) {
            return slug + ".spec0_" + index;
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

    private void clearAllMeetingData() {
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        jdbcTemplate.execute("TRUNCATE TABLE meeting_participants");
        jdbcTemplate.execute("TRUNCATE TABLE motions");
        jdbcTemplate.execute("TRUNCATE TABLE agenda_items");
        jdbcTemplate.execute("TRUNCATE TABLE meetings");
        jdbcTemplate.execute("TRUNCATE TABLE vote_sessions");
        jdbcTemplate.execute("TRUNCATE TABLE vote_options");
        jdbcTemplate.execute("TRUNCATE TABLE vote_results");
        jdbcTemplate.execute("TRUNCATE TABLE vote_result_options");
        jdbcTemplate.execute("TRUNCATE TABLE vote_ballots");
        jdbcTemplate.execute("TRUNCATE TABLE vote_ballot_choices");
        jdbcTemplate.execute("TRUNCATE TABLE vote_eligibilities");
        jdbcTemplate.execute("TRUNCATE TABLE meeting_documents");
        jdbcTemplate.execute("TRUNCATE TABLE meeting_invitations");
        jdbcTemplate.execute("TRUNCATE TABLE meeting_guests");
        jdbcTemplate.execute("TRUNCATE TABLE saved_meetings");
        jdbcTemplate.execute("TRUNCATE TABLE minutes");
        jdbcTemplate.execute("TRUNCATE TABLE speaker_queues");
        jdbcTemplate.execute("TRUNCATE TABLE speaker_turns");
        jdbcTemplate.execute("TRUNCATE TABLE attendance_logs");
        jdbcTemplate.execute("TRUNCATE TABLE agenda_item_feedbacks");
        jdbcTemplate.execute("TRUNCATE TABLE opinions");
        jdbcTemplate.execute("TRUNCATE TABLE opinion_documents");
        jdbcTemplate.execute("TRUNCATE TABLE approval_requests");
        jdbcTemplate.execute("TRUNCATE TABLE approval_steps");
        jdbcTemplate.execute("TRUNCATE TABLE personal_notes");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
    }
}
