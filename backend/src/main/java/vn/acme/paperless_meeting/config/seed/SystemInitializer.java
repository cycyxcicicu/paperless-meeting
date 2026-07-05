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
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Permission;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.RolePermission;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;
import vn.acme.paperless_meeting.entity.enums.PositionRole;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.PermissionRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;
import vn.acme.paperless_meeting.repository.RolePermissionRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@ConditionalOnProperty(prefix = "app.init", name = "enabled", havingValue = "true")
@Slf4j
public class SystemInitializer implements CommandLineRunner {
    static final String DEFAULT_PASSWORD = "12345678";
    static final String ROOT_DEPARTMENT_NAME = "UBND thành phố Hải Phòng";
    static final String ROOT_DEPARTMENT_CODE = "ubndhp";
    static final LocalDateTime INITIALIZATION_TIME = LocalDateTime.of(2026, 7, 5, 0, 0);

    DepartmentRepository departmentRepository;
    PositionRepository positionRepository;
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RolePermissionRepository rolePermissionRepository;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    static final List<DepartmentBlueprint> DEPARTMENT_BLUEPRINTS = List.of(
            new DepartmentBlueprint("Văn phòng UBND thành phố", "vpubnd", List.of("Phòng Tổng hợp", "Phòng Hành chính - Tổ chức", "Phòng Hành chính - Quản trị", "Phòng Nội chính - Pháp chế")),
            new DepartmentBlueprint("Sở Nội vụ", "sonv", List.of("Văn phòng Sở", "Phòng Tổ chức cán bộ", "Phòng Cải cách hành chính", "Phòng Xây dựng chính quyền và Công tác thanh niên")),
            new DepartmentBlueprint("Sở Tư pháp", "sotp", List.of("Văn phòng Sở", "Phòng Hành chính tư pháp", "Phòng Phổ biến, giáo dục pháp luật", "Phòng Bổ trợ tư pháp")),
            new DepartmentBlueprint("Sở Kế hoạch và Đầu tư", "sokhdt", List.of("Văn phòng Sở", "Phòng Tổng hợp, Quy hoạch", "Phòng Đăng ký kinh doanh", "Phòng Kinh tế đối ngoại")),
            new DepartmentBlueprint("Sở Tài chính", "sotc", List.of("Văn phòng Sở", "Phòng Ngân sách", "Phòng Quản lý giá", "Phòng Quản lý đầu tư tài chính")),
            new DepartmentBlueprint("Sở Công Thương", "soct", List.of("Văn phòng Sở", "Phòng Quản lý công nghiệp", "Phòng Quản lý thương mại", "Phòng Kỹ thuật an toàn - Môi trường")),
            new DepartmentBlueprint("Sở Nông nghiệp và Phát triển nông thôn", "sonnptnt", List.of("Văn phòng Sở", "Phòng Trồng trọt và Bảo vệ thực vật", "Phòng Chăn nuôi và Thú y", "Phòng Kế hoạch, Tài chính")),
            new DepartmentBlueprint("Sở Giao thông vận tải", "sogtvt", List.of("Văn phòng Sở", "Phòng Quản lý vận tải", "Phòng Quản lý kết cấu hạ tầng giao thông", "Phòng Pháp chế - Thanh tra")),
            new DepartmentBlueprint("Sở Xây dựng", "soxd", List.of("Văn phòng Sở", "Phòng Quy hoạch - Kiến trúc", "Phòng Hạ tầng kỹ thuật", "Phòng Quản lý nhà và thị trường bất động sản")),
            new DepartmentBlueprint("Sở Tài nguyên và Môi trường", "sotnmt", List.of("Văn phòng Sở", "Phòng Quản lý đất đai", "Phòng Khoáng sản và Tài nguyên nước", "Phòng Bảo vệ môi trường")),
            new DepartmentBlueprint("Sở Thông tin và Truyền thông", "sotttt", List.of("Văn phòng Sở", "Phòng Công nghệ thông tin", "Phòng Bưu chính - Viễn thông", "Phòng Thông tin - Báo chí - Xuất bản")),
            new DepartmentBlueprint("Sở Lao động - Thương binh và Xã hội", "soldtbxh", List.of("Văn phòng Sở", "Phòng Chính sách lao động", "Phòng Người có công", "Phòng Bảo trợ xã hội")),
            new DepartmentBlueprint("Sở Văn hóa và Thể thao", "sovhtt", List.of("Văn phòng Sở", "Phòng Quản lý văn hóa", "Phòng Quản lý thể dục thể thao", "Phòng Tổ chức - Pháp chế")),
            new DepartmentBlueprint("Sở Du lịch", "sdl", List.of("Văn phòng Sở", "Phòng Quản lý lữ hành", "Phòng Quản lý cơ sở lưu trú du lịch", "Phòng Kế hoạch, Quy hoạch và Phát triển du lịch")),
            new DepartmentBlueprint("Sở Khoa học và Công nghệ", "sokhcn", List.of("Văn phòng Sở", "Phòng Quản lý khoa học", "Phòng Quản lý công nghệ và đổi mới sáng tạo", "Phòng Tiêu chuẩn - Đo lường - Chất lượng")),
            new DepartmentBlueprint("Sở Giáo dục và Đào tạo", "sogddt", List.of("Văn phòng Sở", "Phòng Giáo dục Mầm non", "Phòng Giáo dục Phổ thông", "Phòng Kế hoạch - Tài chính")),
            new DepartmentBlueprint("Sở Y tế", "soyt", List.of("Văn phòng Sở", "Phòng Nghiệp vụ Y", "Phòng Nghiệp vụ Dược", "Phòng Kế hoạch - Tài chính")),
            new DepartmentBlueprint("Sở Ngoại vụ", "songoaivu", List.of("Văn phòng Sở", "Phòng Hợp tác quốc tế", "Phòng Lãnh sự và Phiên dịch", "Phòng Quản lý biên giới")),
            new DepartmentBlueprint("Thanh tra thành phố", "thanhtra", List.of("Văn phòng Thanh tra", "Phòng Tiếp công dân", "Phòng Giải quyết khiếu nại, tố cáo số 1", "Phòng Giải quyết khiếu nại, tố cáo số 2")),
            new DepartmentBlueprint("Ban Quản lý Khu kinh tế Hải Phòng", "bqlkkt", List.of("Văn phòng Ban", "Phòng Quản lý đầu tư", "Phòng Quản lý doanh nghiệp", "Phòng Quản lý hạ tầng"))
    );

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Bắt đầu khởi tạo dữ liệu hệ thống chạy lần đầu (Production Initialization)...");
        
        Map<String, Department> departmentByPath = ensureDepartments();
        Map<String, Position> positionByCode = ensurePositions(departmentByPath);
        
        Map<String, Role> roleByCode = ensureRoles();
        Map<String, Permission> permissionByCode = ensurePermissions();
        ensureRolePermissions(roleByCode, permissionByCode);
        
        ensureSuperAdmin(departmentByPath, positionByCode, roleByCode);
        ensureDepartmentUsers(departmentByPath, positionByCode, roleByCode);
        
        log.info("Hoàn thành khởi tạo dữ liệu hệ thống chạy lần đầu thành công!");
    }

    private Map<String, Department> ensureDepartments() {
        log.info("Đang khởi tạo các đơn vị/phòng ban hành chính...");
        
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
                department.setDescription("Đơn vị hành chính: " + seed.name());
                department = departmentRepository.save(department);
                existing.add(department);
            } else {
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
        if (ROOT_DEPARTMENT_NAME.equals(seed.path())) {
            return ROOT_DEPARTMENT_CODE;
        }
        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            if (blueprint.topLevelPath().equals(seed.path())) {
                return blueprint.slug();
            }
        }
        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            if (blueprint.topLevelPath().equals(seed.parentPath())) {
                return blueprint.slug() + "-" + slugify(seed.name());
            }
        }
        return slugify(seed.name());
    }

    private String slugify(String input) {
        if (input == null) {
            return java.util.UUID.randomUUID().toString().substring(0, 8);
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
        seeds.add(new DepartmentSeed(ROOT_DEPARTMENT_NAME, null));

        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            String topLevelPath = blueprint.topLevelPath();
            seeds.add(new DepartmentSeed(topLevelPath, ROOT_DEPARTMENT_NAME));

            for (String childUnit : blueprint.childUnits()) {
                seeds.add(new DepartmentSeed(blueprint.childPath(childUnit), topLevelPath));
            }
        }

        return seeds;
    }

    private Department findDepartmentByNameAndParent(List<Department> departments, String departmentName, Department parentDepartment) {
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
            if (currentParent != null && parentDepartment.getId() != null && parentDepartment.getId().equals(currentParent.getId())) {
                return department;
            }
        }
        return null;
    }

    private Map<String, Position> ensurePositions(Map<String, Department> departmentByPath) {
        log.info("Đang khởi tạo danh mục chức danh/chức vụ...");
        
        Map<String, Position> existingByCode = indexBy(positionRepository.findAll(), Position::getPositionCode);
        Map<String, Position> result = new LinkedHashMap<>();

        // 1. Tạo các Chức vụ hệ thống (Department = null)
        List<PositionSeed> globalSeeds = List.of(
            new PositionSeed("CHU_TICH", "Chủ tịch UBND", "Đứng đầu thành phố", 1, true, PositionRole.CHAIRMAN_CITY),
            new PositionSeed("PHO_CHU_TICH", "Phó Chủ tịch UBND", "Cấp phó thành phố", 2, true, PositionRole.VICE_CHAIRMAN_CITY),
            new PositionSeed("GIAM_DOC", "Giám đốc / Chánh văn phòng", "Thủ trưởng đơn vị sở ngành", 10, true, PositionRole.HEAD_OF_DEPARTMENT_LEVEL),
            new PositionSeed("PHO_GIAM_DOC", "Phó Giám đốc / Phó chánh văn phòng", "Cấp phó đơn vị sở ngành", 11, true, PositionRole.DEPUTY_OF_DEPARTMENT_LEVEL),
            new PositionSeed("TRUONG_PHONG", "Trưởng phòng", "Lãnh đạo phòng ban trực thuộc", 15, true, PositionRole.HEAD_OF_DIVISION),
            new PositionSeed("PHO_TRUONG_PHONG", "Phó Trưởng phòng", "Phó phòng ban trực thuộc", 16, true, PositionRole.DEPUTY_OF_DIVISION),
            new PositionSeed("THU_KY", "Thư ký", "Thư ký / Văn phòng", 19, false, PositionRole.SPECIALIST),
            new PositionSeed("CHUYEN_VIEN", "Chuyên viên", "Cán bộ chuyên môn", 20, false, PositionRole.SPECIALIST)
        );

        for (PositionSeed seed : globalSeeds) {
            Position saved = upsertPosition(seed, null, existingByCode);
            result.put(seed.code(), saved);
        }
        
        // 2. Tạo chức vụ đặc thù cấp Đơn vị (Department != null)
        for (Department department : departmentByPath.values()) {
            boolean isTopLevel = department.getParentDepartment() == null || ROOT_DEPARTMENT_NAME.equals(department.getParentDepartment().getDeptName());
            if (isTopLevel && !ROOT_DEPARTMENT_NAME.equals(department.getDeptName())) {
                String deptCode = department.getCode();
                if (deptCode != null) {
                    String specCode = deptCode + "_spec_custom";
                    String specName = getCustomPositionName(deptCode);
                    String secretaryCode = deptCode + "_thu_ky";
                    String secretaryName = "Thư ký " + department.getDeptName();
                    
                    List<PositionSeed> unitSpecificSeeds = List.of(
                        new PositionSeed(specCode, specName, "Chức vụ đặc thù cho đơn vị " + department.getDeptName(), 18, false, PositionRole.SPECIALIST),
                        new PositionSeed(secretaryCode, secretaryName, "Thư ký hội họp cho đơn vị " + department.getDeptName(), 19, false, PositionRole.SPECIALIST)
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
            case "sonv" -> "Chuyên viên Tổ chức cán bộ";
            case "sotp" -> "Công chứng viên";
            case "sokhdt" -> "Chuyên viên quản lý đầu tư";
            case "sotc" -> "Kiểm soát viên ngân sách";
            case "soct" -> "Chuyên viên quản lý năng lượng";
            case "sonnptnt" -> "Chuyên viên bảo vệ thực vật";
            case "sogtvt" -> "Chuyên viên quản lý vận tải";
            case "soxd" -> "Kỹ sư quy hoạch xây dựng";
            case "sotnmt" -> "Chuyên viên quản lý đất đai";
            case "sotttt" -> "Kỹ sư an toàn thông tin";
            case "soldtbxh" -> "Chuyên viên bảo trợ xã hội";
            case "sovhtt" -> "Chuyên viên quản lý văn hóa";
            case "sdl" -> "Chuyên viên quản lý du lịch";
            case "sokhcn" -> "Chuyên viên quản lý công nghệ";
            case "sogddt" -> "Thanh tra viên giáo dục";
            case "soyt" -> "Bác sĩ chính";
            case "songoaivu" -> "Phiên dịch viên đối ngoại";
            case "thanhtra" -> "Thanh tra viên";
            case "bqlkkt" -> "Chuyên viên quản lý khu công nghiệp";
            default -> "Chuyên viên chuyên môn đặc thù";
        };
    }

    private Position upsertPosition(PositionSeed seed, Department department, Map<String, Position> existingByCode) {
        Position position = existingByCode.get(seed.code());
        if (position == null) {
            position = new Position();
            position.setCreatedAt(INITIALIZATION_TIME);
        }

        position.setPositionCode(seed.code());
        position.setPositionName(seed.name());
        position.setDescription(seed.description());
        position.setRankOrder(seed.rankOrder());
        position.setIsLeadership(seed.isLeadership());
        position.setPositionRole(seed.positionRole());
        position.setDepartment(null); // System-wide standard positions
        position.setUpdatedAt(INITIALIZATION_TIME);
        position.setIsDeleted(false);

        Position saved = positionRepository.save(position);
        existingByCode.put(seed.code(), saved);
        return saved;
    }

    private Map<String, Role> ensureRoles() {
        log.info("Đang khởi tạo các vai trò hệ thống...");
        
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
        log.info("Đang khởi tạo danh mục quyền hạn (Permissions)...");
        
        List<PermissionSeed> seeds = List.of(
                new PermissionSeed("PROFILE_UPDATE_SELF", "User can update own profile"),
                new PermissionSeed("USER_VIEW_DEPARTMENT", "View users in own department"),
                new PermissionSeed("USER_MANAGE_DEPARTMENT", "Manage users in own department"),
                new PermissionSeed("USER_VIEW_ALL", "View users across system"),
                new PermissionSeed("USER_MANAGE_ALL", "Manage users across system"),

                new PermissionSeed("MEETING_CREATE", "Create meeting in allowed department"),
                new PermissionSeed("MEETING_VIEW_OWN", "View meetings the user created"),
                new PermissionSeed("MEETING_MANAGE_OWN", "Manage meetings the user created"),
                new PermissionSeed("MEETING_VIEW_DEPARTMENT", "View meetings in department"),
                new PermissionSeed("MEETING_MANAGE_DEPARTMENT", "Manage meetings in department"),
                new PermissionSeed("MEETING_VIEW_ALL", "View all meetings"),
                new PermissionSeed("MEETING_MANAGE_ALL", "Manage all meetings"),

                new PermissionSeed("LOCATION_VIEW_DEPARTMENT", "View locations in department"),
                new PermissionSeed("LOCATION_MANAGE_DEPARTMENT", "Manage locations in department"),
                new PermissionSeed("LOCATION_VIEW_ALL", "View locations across system"),
                new PermissionSeed("LOCATION_MANAGE_ALL", "Manage locations across system"),

                new PermissionSeed("REPORT_VIEW_DEPARTMENT", "View reports in department"),
                new PermissionSeed("REPORT_VIEW_ALL", "View reports across system"),

                new PermissionSeed("MEETING_VIEW", "Legacy: view meeting"),
                new PermissionSeed("MEETING_UPDATE", "Legacy: update meeting"),
                new PermissionSeed("MEETING_CANCEL", "Legacy: cancel meeting"),
                new PermissionSeed("PARTICIPANT_MANAGE", "Manage meeting participants"),
                new PermissionSeed("AGENDA_MANAGE", "Manage agenda items"),

                new PermissionSeed("MANAGE_ROLE_ASSIGNMENTS", "Assign and revoke user-role links"),
                new PermissionSeed("VIEW_ROLE_ASSIGNMENTS", "View user-role links")
        );

        Map<String, Permission> existingByCode = indexBy(permissionRepository.findAll(), permission -> permission.getPermCode().toUpperCase());
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
        log.info("Đang liên kết quyền hạn vào các vai trò...");
        
        Set<String> allCodes = new LinkedHashSet<>(permissionByCode.keySet());
        Map<String, Set<String>> matrix = new LinkedHashMap<>();

        matrix.put("SUPER_ADMIN", allCodes);

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
                "MEETING_VIEW",
                "MEETING_UPDATE",
                "PARTICIPANT_MANAGE"
        ));

        matrix.put("USER", Set.of(
                "PROFILE_UPDATE_SELF",
                "MEETING_CREATE",
                "MEETING_VIEW_OWN",
                "MEETING_MANAGE_OWN",
                "MEETING_VIEW"
        ));

        for (Map.Entry<String, Set<String>> entry : matrix.entrySet()) {
            Role role = roleByCode.get(entry.getKey());
            if (role == null) {
                throw new IllegalStateException("Không tìm thấy vai trò đã seed: " + entry.getKey());
            }

            Set<String> assignedCodes = rolePermissionRepository.findPermissionCodesByRoleId(role.getId());
            for (String code : entry.getValue()) {
                if (assignedCodes.contains(code)) {
                    continue;
                }

                Permission permission = permissionByCode.get(code);
                if (permission == null) {
                    throw new IllegalStateException("Không tìm thấy quyền hạn đã seed: " + code);
                }

                RolePermission rolePermission = new RolePermission();
                rolePermission.setRole(role);
                rolePermission.setPermission(permission);
                rolePermissionRepository.save(rolePermission);
            }
        }
    }

    private void ensureSuperAdmin(Map<String, Department> departmentByPath, Map<String, Position> positionByCode, Map<String, Role> roleByCode) {
        log.info("Đang khởi tạo tài khoản quản trị tối cao (Super Admin)...");
        
        String username = "admin";
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setFullName("Quản trị hệ thống");
            user.setEmail("admin@paperless.gov.vn");
            user.setPhone("0900000000");
            user.setStatus(UserStatus.ACTIVE);
            user.setIsFirstLogin(true);
            user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
            
            Position position = positionByCode.get("CHU_TICH");
            if (position == null) {
                throw new IllegalStateException("Không tìm thấy chức vụ CHU_TICH để gán cho admin");
            }
            user.setPosition(position);

            Department dept = departmentByPath.get(ROOT_DEPARTMENT_NAME);
            if (dept == null) {
                throw new IllegalStateException("Không tìm thấy đơn vị cấp gốc để gán cho admin");
            }
            user.setDepartment(dept);

            Role role = roleByCode.get("SUPER_ADMIN");
            if (role == null) {
                throw new IllegalStateException("Không tìm thấy vai trò SUPER_ADMIN để gán cho admin");
            }
            user.setRole(role);

            userRepository.save(user);
            log.info("==> TÀI KHOẢN QUẢN TRỊ MẶC ĐỊNH: username = '{}' | password = '{}'", username, DEFAULT_PASSWORD);
        } else {
            // Đảm bảo cập nhật phân quyền quản trị tối cao nếu tài khoản đã tồn tại
            boolean changed = false;
            Role role = roleByCode.get("SUPER_ADMIN");
            if (user.getRole() == null || !user.getRole().getId().equals(role.getId())) {
                user.setRole(role);
                changed = true;
            }
            if (user.getStatus() != UserStatus.ACTIVE) {
                user.setStatus(UserStatus.ACTIVE);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
        }
    }

    private void ensureDepartmentUsers(Map<String, Department> departmentByPath, Map<String, Position> positionByCode, Map<String, Role> roleByCode) {
        log.info("Đang khởi tạo các tài khoản quản trị và thư ký cho từng Sở ban ngành...");
        
        Role deptAdminRole = roleByCode.get("DEPARTMENT_ADMIN");
        Role userRole = roleByCode.get("USER");
        if (deptAdminRole == null || userRole == null) {
            throw new IllegalStateException("Không tìm thấy vai trò DEPARTMENT_ADMIN hoặc USER để gán");
        }

        int index = 1;
        for (DepartmentBlueprint blueprint : DEPARTMENT_BLUEPRINTS) {
            Department department = departmentByPath.get(blueprint.topLevelPath());
            if (department == null) {
                continue;
            }
            
            String deptCode = blueprint.slug();
            String passwordHash = passwordEncoder.encode(DEFAULT_PASSWORD);
            
            // 1. Tạo tài khoản Lãnh đạo đơn vị
            String adminUsername = deptCode + "_admin";
            if (!userRepository.findByUsername(adminUsername).isPresent()) {
                User deptAdmin = new User();
                deptAdmin.setUsername(adminUsername);
                deptAdmin.setFullName("Lãnh đạo " + blueprint.name());
                deptAdmin.setEmail(deptCode + "_admin@paperless.gov.vn");
                deptAdmin.setPhone(String.format("0912%06d", index));
                deptAdmin.setStatus(UserStatus.ACTIVE);
                deptAdmin.setIsFirstLogin(true);
                deptAdmin.setPassword(passwordHash);
                deptAdmin.setDepartment(department);
                deptAdmin.setRole(deptAdminRole);
                
                Position pos = positionByCode.get("GIAM_DOC");
                if (pos != null) {
                    deptAdmin.setPosition(pos);
                }
                userRepository.save(deptAdmin);
            }
            
            // 2. Tạo tài khoản Thư ký đơn vị
            String secretaryUsername = deptCode + "_thuky";
            if (!userRepository.findByUsername(secretaryUsername).isPresent()) {
                User deptSecretary = new User();
                deptSecretary.setUsername(secretaryUsername);
                deptSecretary.setFullName("Thư ký " + blueprint.name());
                deptSecretary.setEmail(deptCode + "_thuky@paperless.gov.vn");
                deptSecretary.setPhone(String.format("0913%06d", index));
                deptSecretary.setStatus(UserStatus.ACTIVE);
                deptSecretary.setIsFirstLogin(true);
                deptSecretary.setPassword(passwordHash);
                deptSecretary.setDepartment(department);
                deptSecretary.setRole(userRole);
                
                Position pos = positionByCode.get(deptCode + "_thu_ky");
                if (pos == null) {
                    pos = positionByCode.get("THU_KY"); // Fallback
                }
                if (pos != null) {
                    deptSecretary.setPosition(pos);
                }
                userRepository.save(deptSecretary);
            }
            
            index++;
        }
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

    private record DepartmentBlueprint(
            String name,
            String slug,
            List<String> childUnits) {

        private String topLevelPath() {
            return ROOT_DEPARTMENT_NAME + "/" + name;
        }

        private String childPath(String childUnit) {
            return topLevelPath() + "/" + childUnit;
        }
    }
}
