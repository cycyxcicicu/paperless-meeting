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

        Map<String, Role> roleByCode = ensureRoles();
        Map<String, Permission> permissionByCode = ensurePermissions();
        ensureRolePermissions(roleByCode, permissionByCode);

        Map<String, User> userByUsername = ensureUsers(departmentByPath, positionByCode);
        ensureRoleAssignments(roleByCode, userByUsername);

        Map<String, Location> locationByCode = ensureLocations(departmentByPath);
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
            new PositionSeed("CHUYEN_VIEN", "Chuyên viên", "Cán bộ chuyên môn", 20, false, PositionRole.SPECIALIST)
        );

        for (PositionSeed seed : globalSeeds) {
            Position saved = upsertPosition(seed, null, existingByCode);
            result.put(seed.code(), saved);
        }

        // 2. Tạo một vài chức vụ mẫu đặc thù cấp Đơn vị (Department != null)
        for (Department department : departmentByPath.values()) {
            boolean isTopLevel = department.getParentDepartment() == null || ROOT_DEPARTMENT.equals(department.getParentDepartment().getDeptName());
            if (isTopLevel && !ROOT_DEPARTMENT.equals(department.getDeptName())) {
                String deptCode = department.getCode();
                List<PositionSeed> unitSpecificSeeds = List.of(
                    new PositionSeed(deptCode + "_ketoan", "Kế toán trưởng (" + deptCode.toUpperCase() + ")", "Kế toán đặc thù", 18, true, PositionRole.SPECIALIST)
                );
                for (PositionSeed seed : unitSpecificSeeds) {
                    Position saved = upsertPosition(seed, department, existingByCode);
                    result.put(seed.code(), saved);
                }
            }
        }
        
        return result;
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

    private List<UserSeed> buildRosterSeeds(DepartmentBlueprint blueprint) {
        List<UserSeed> seeds = new ArrayList<>();
        String topCode = blueprint.slug();
        String topPath = blueprint.topLevelPath();
        
        seeds.add(new UserSeed(blueprint.adminUsername(), (blueprint.isCentralOffice() ? "Chủ tịch UBND thành phố" : "Thủ trưởng " + blueprint.name()), blueprint.adminUsername() + "@paperless.local", buildPhoneNumber(blueprint.departmentIndex(), 1, 1), topPath, blueprint.isCentralOffice() ? "CHU_TICH" : "GIAM_DOC"));
        
        for (int i = 1; i <= 3; i++) {
            seeds.add(new UserSeed(topCode + ".pgd" + i, (blueprint.isCentralOffice() ? "Phó Chủ tịch " + i : "Phó Thủ trưởng " + i) + " " + blueprint.name(), topCode + ".pgd" + i + "@paperless.local", buildPhoneNumber(blueprint.departmentIndex(), 2, i), topPath, blueprint.isCentralOffice() ? "PHO_CHU_TICH" : "PHO_GIAM_DOC"));
        }

        int staffCounter = 1;
        for (int pIdx = 0; pIdx < blueprint.childUnits().size(); pIdx++) {
            String childUnit = blueprint.childUnits().get(pIdx);
            String childPath = blueprint.childPath(childUnit);
            
            seeds.add(new UserSeed(topCode + ".manager" + pIdx, "Trưởng " + childUnit, topCode + ".manager" + pIdx + "@paperless.local", buildPhoneNumber(blueprint.departmentIndex(), 3, staffCounter++), childPath, "TRUONG_PHONG"));
            
            int targetStaffCount = (pIdx == 0) ? 12 : ((pIdx == 1) ? 8 : 16);
            int deputies = (targetStaffCount >= 15) ? 3 : ((targetStaffCount >= 10) ? 2 : 1);
            
            for (int i = 1; i <= deputies; i++) {
                seeds.add(new UserSeed(topCode + ".deputy" + pIdx + "_" + i, "Phó " + childUnit + " " + i, topCode + ".deputy" + pIdx + "_" + i + "@paperless.local", buildPhoneNumber(blueprint.departmentIndex(), 4, staffCounter++), childPath, "PHO_TRUONG_PHONG"));
            }
            
            int specialists = targetStaffCount - 1 - deputies;
            for (int i = 1; i <= specialists; i++) {
                seeds.add(new UserSeed(topCode + ".spec" + pIdx + "_" + i, "Chuyên viên " + childUnit + " " + i, topCode + ".spec" + pIdx + "_" + i + "@paperless.local", buildPhoneNumber(blueprint.departmentIndex(), 5, staffCounter++), childPath, "CHUYEN_VIEN"));
            }
        }

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
                "CHUYEN_VIEN");
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
                "https://meet.hp.local/" + blueprint.slug() + "/draft",
                startTime,
                startTime.plusMinutes(90),
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
                "https://meet.hp.local/" + blueprint.slug() + "/operational",
                startTime,
                startTime.plusMinutes(120),
                10,
                MeetingStatus.UPCOMING,
                null,
                blueprint.creatorUsername(1),
                blueprint.topLevelPath(),
                blueprint.locationCode("hall"),
                MeetingScenario.INTERNAL_OPERATIONAL);
    }

    private MeetingSeed buildReviewMeetingSeed(DepartmentBlueprint blueprint, int departmentIndex) {
        MeetingStatus status = departmentIndex % 2 == 0 ? MeetingStatus.CLOSED : MeetingStatus.IN_PROGRESS;
        LocalDateTime startTime = status == MeetingStatus.IN_PROGRESS
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
                "https://meet.hp.local/" + blueprint.slug() + "/review",
                startTime,
                startTime.plusMinutes(90),
                10,
                status,
                null,
                blueprint.creatorUsername(2),
                blueprint.topLevelPath(),
                blueprint.locationCode("online"),
                MeetingScenario.INTERNAL_REVIEW);
    }

    private MeetingSeed buildInterDepartmentalMeetingSeed(DepartmentBlueprint blueprint, int departmentIndex) {
        MeetingStatus status = departmentIndex % 4 == 0 ? MeetingStatus.CANCELLED : MeetingStatus.UPCOMING;
        LocalDateTime startTime = meetingDate(20L + departmentIndex, 15, 0);
        return new MeetingSeed(
                departmentIndex,
                blueprint.slug(),
                blueprint.name(),
                blueprint.focusLabel(),
                "Điều phối liên ngành về " + blueprint.focusLabel() + " - " + blueprint.name(),
                "Phối hợp các đơn vị để xử lý nhóm nhiệm vụ " + blueprint.focusLabel() + ".",
                "https://meet.hp.local/" + blueprint.slug() + "/inter-dept",
                startTime,
                startTime.plusMinutes(120),
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
}
