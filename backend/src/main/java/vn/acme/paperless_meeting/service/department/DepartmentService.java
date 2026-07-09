package vn.acme.paperless_meeting.service.department;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.dto.response.department.DepartmentChildResponse;
import vn.acme.paperless_meeting.dto.response.department.DepartmentStatsResponse;
import vn.acme.paperless_meeting.dto.response.department.DepartmentTreeResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;
import vn.acme.paperless_meeting.mapper.department.DepartmentMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.specification.department.DepartmentSpecification;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DepartmentService {
    DepartmentRepository departmentRepository;
    DepartmentMapper departmentMapper;
    CurrentUserService currentUserService;
    UserRepository userRepository;
    AuditLogPublisher auditLogPublisher;

    public List<DepartmentTreeResponse> getTree() {
        return getTree(null);
    }

    public List<DepartmentTreeResponse> getTree(Boolean full) {
        User caller = currentUserService.getCurrentActiveUser();

        if (Boolean.TRUE.equals(full) || currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            return buildFullTree();
        }

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                return List.of();
            }
            return buildSubTree(callerDeptId);
        }

        if (currentUserService.canCreateMeeting()) {
            return buildFullTree();
        }

        if (caller.getDepartment() != null) {
            Department d = caller.getDepartment();
            DepartmentTreeResponse resp = DepartmentTreeResponse.builder()
                    .id(d.getId())
                    .deptName(d.getDeptName())
                    .code(d.getCode())
                    .parentDepartmentId(d.getParentDepartment() != null ? d.getParentDepartment().getId() : null)
                    .build();
            return List.of(resp);
        }

        return List.of();
    }

    private Map<UUID, DepartmentTreeResponse> buildLinkedResponseMap(List<Department> departments) {
        var map = new HashMap<UUID, DepartmentTreeResponse>();

        for (var d : departments) {
            var resp = DepartmentTreeResponse.builder()
                    .id(d.getId())
                    .deptName(d.getDeptName())
                    .code(d.getCode())
                    .parentDepartmentId(d.getParentDepartment() != null ? d.getParentDepartment().getId() : null)
                    .build();
            map.put(resp.getId(), resp);
        }

        for (var d : departments) {
            var resp = map.get(d.getId());
            if (resp.getParentDepartmentId() != null) {
                var parent = map.get(resp.getParentDepartmentId());
                if (parent != null) {
                    parent.getChildren().add(resp);
                }
            }
        }
        return map;
    }

    private List<DepartmentTreeResponse> buildFullTree() {
        var departments = departmentRepository.findAll();
        var map = buildLinkedResponseMap(departments);

        List<DepartmentTreeResponse> roots = new ArrayList<>();
        for (var d : departments) {
            var resp = map.get(d.getId());
            if (resp.getParentDepartmentId() == null || map.get(resp.getParentDepartmentId()) == null) {
                roots.add(resp);
            }
        }
        return roots;
    }

    private List<DepartmentTreeResponse> buildSubTree(UUID rootId) {
        var departments = departmentRepository.findAll();
        var map = buildLinkedResponseMap(departments);

        DepartmentTreeResponse rootNode = map.get(rootId);
        if (rootNode != null) {
            return List.of(rootNode);
        }
        return List.of();
    }

    public List<DepartmentResponse> findAll() {
        var departments = departmentRepository.findAll();

        var map = new HashMap<UUID, DepartmentResponse>();
        for (var d : departments) {
            var resp = departmentMapper.toResponse(d);
            map.put(resp.getId(), resp);
        }

        List<DepartmentResponse> roots = new ArrayList<>();
        for (var d : departments) {
            var resp = map.get(d.getId());
            UUID parentId = null;
            if (d.getParentDepartment() != null) {
                parentId = d.getParentDepartment().getId();
            }
            if (parentId == null) {
                roots.add(resp);
            } else {
                var parent = map.get(parentId);
                if (parent != null) {
                    parent.getChildren().add(resp);
                } else {
                    roots.add(resp);
                }
            }
        }

        return roots;
    }

    @Transactional(readOnly = true)
    public PageResponse<DepartmentChildResponse> getChildrenPage(UUID parentId, String keyword, Pageable pageable) {
        User caller = currentUserService.getCurrentActiveUser();

        // Kiểm tra quyền
        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN) && !currentUserService.canCreateMeeting()) {
            if (parentId == null) {
                // DEPARTMENT_ADMIN không được xem gốc của toàn hệ thống (trừ khi gốc đó là Sở
                // của họ, nhưng parentId=null nghĩa là root system)
                // Tuy nhiên, họ có thể xem danh sách con của các phòng nằm trong quyền quản lý
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }

            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }

            if (!getAllSubDepartmentIds(callerDeptId).contains(parentId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        Specification<Department> spec = DepartmentSpecification.build(keyword, parentId);
        Page<Department> page = departmentRepository.findAll(spec, pageable);

        List<DepartmentChildResponse> content = page.getContent().stream()
                .map(departmentMapper::toChildResponse)
                .toList();

        return PageResponse.<DepartmentChildResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public DepartmentStatsResponse getDepartmentStats() {
        User caller = currentUserService.getCurrentActiveUser();
        long totalUnits = 0;
        long activeUnits = 0;

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // Cấp SUPER_ADMIN: Chỉ tính đơn vị cấp 2 (Sở/Ban/Ngành - Parent is Level 1)
            totalUnits = departmentRepository.countLevel2Departments();
            activeUnits = departmentRepository.countLevel2DepartmentsByStatus(DepartmentStatus.ACTIVE);
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            // Cấp DEPARTMENT_ADMIN: Chỉ lấy số đơn vị con trực thuộc (Level 3 nếu admin quản lý Level 2)
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId != null) {
                totalUnits = departmentRepository.countByParentDepartment_Id(callerDeptId);
                activeUnits = departmentRepository.countByParentDepartment_IdAndStatus(callerDeptId, DepartmentStatus.ACTIVE);
            }
        } else {
            totalUnits = departmentRepository.count();
            activeUnits = departmentRepository.countByStatus(DepartmentStatus.ACTIVE);
        }

        return DepartmentStatsResponse.builder()
                .totalUnits(totalUnits)
                .activeUnits(activeUnits)
                .build();
    }

    public DepartmentResponse findById(UUID id) {
        return departmentMapper.toResponse(getDepartment(id));
    }

    public DepartmentResponse create(DepartmentUpsertRequest request) {
        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        User caller = currentUserService.getCurrentActiveUser();
        requireAdminAccessToDepartment(caller, request.getParentDepartmentId());

        adjustDepartmentDepth(request);
        validateDepartmentFields(request);
        validateDuplicate(request.getDeptName(), request.getParentDepartmentId(), null);

        Department department = departmentMapper.toEntity(request);

        setParentDepartment(department, request.getParentDepartmentId());

        Department saved = departmentRepository.save(department);
        auditLogPublisher.publish(
                caller,
                AuditAction.CREATE_DEPARTMENT,
                ResourceType.DEPARTMENT,
                saved.getId(),
                Map.of("name", saved.getDeptName(), "code", saved.getCode())
        );
        return departmentMapper.toResponse(saved);
    }

    public DepartmentResponse update(UUID id, DepartmentUpsertRequest request) {
        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        Department department = getDepartment(id);
        User caller = currentUserService.getCurrentActiveUser();

        requireAdminAccessToDepartment(caller, id);

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            UUID oldParentId = department.getParentDepartment() != null ? department.getParentDepartment().getId()
                    : null;
            request.setParentDepartmentId(oldParentId);
        } else {
            if (request.getParentDepartmentId() != null && request.getParentDepartmentId().equals(id)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
        }

        adjustDepartmentDepth(request);
        validateDepartmentFields(request);
        validateDuplicate(request.getDeptName(), request.getParentDepartmentId(), id);
        departmentMapper.updateEntity(request, department);
        setParentDepartment(department, request.getParentDepartmentId());

        Department saved = departmentRepository.save(department);
        auditLogPublisher.publish(
                caller,
                AuditAction.UPDATE_DEPARTMENT,
                ResourceType.DEPARTMENT,
                saved.getId(),
                Map.of("name", saved.getDeptName(), "code", saved.getCode())
        );
        return departmentMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        Department department = getDepartment(id); // ensure exists

        User caller = currentUserService.getCurrentActiveUser();
        requireAdminAccessToDepartment(caller, id);

        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (caller.getDepartment() != null && id.equals(caller.getDepartment().getId())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        UUID deletedBy = caller != null ? caller.getId() : null;

        List<UUID> allIds = new ArrayList<>();
        allIds.add(id);

        List<UUID> current = List.of(id);
        while (!current.isEmpty()) {
            List<UUID> childIds = departmentRepository.findIdsByParentDepartmentIdIn(current);
            if (childIds == null || childIds.isEmpty())
                break;
            allIds.addAll(childIds);
            current = childIds;
        }

        if (userRepository.existsByDepartmentIdIn(allIds)) {
            throw new AppException(ErrorCode.DEPARTMENT_HAS_USERS);
        }

        final int CHUNK = 500;
        for (int i = 0; i < allIds.size(); i += CHUNK) {
            List<UUID> chunk = allIds.subList(i, Math.min(i + CHUNK, allIds.size()));
            departmentRepository.softDeleteByIds(chunk, deletedBy);
        }

        auditLogPublisher.publish(
                caller,
                AuditAction.DELETE_DEPARTMENT,
                ResourceType.DEPARTMENT,
                id,
                Map.of("name", department.getDeptName(), "code", department.getCode())
        );
    }

    private void setParentDepartment(Department department, UUID parentDepartmentId) {
        Department parentDepartment = null;
        if (parentDepartmentId != null) {
            parentDepartment = getDepartment(parentDepartmentId);
        }
        department.setParentDepartment(parentDepartment);
    }

    private void validateDepartmentFields(DepartmentUpsertRequest request) {
        Map<String, String> errors = new HashMap<>();
        boolean isSubDepartment = request.getParentDepartmentId() != null;
        
        if (request.getDeptName() == null || request.getDeptName().trim().isEmpty()) {
            errors.put("deptName", isSubDepartment ? "Tên phòng ban/bộ phận là bắt buộc" : "Tên đơn vị là bắt buộc");
        } else if (request.getDeptName().length() < 3 || request.getDeptName().length() > 100) {
            errors.put("deptName", isSubDepartment ? "Tên phòng ban/bộ phận phải có độ dài từ 3 đến 100 ký tự" : "Tên đơn vị phải có độ dài từ 3 đến 100 ký tự");
        }
        
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            errors.put("code", isSubDepartment ? "Mã phòng ban/bộ phận là bắt buộc" : "Mã đơn vị là bắt buộc");
        } else if (request.getCode().length() < 1 || request.getCode().length() > 50) {
            errors.put("code", isSubDepartment ? "Mã phòng ban/bộ phận phải có độ dài từ 1 đến 50 ký tự" : "Mã đơn vị phải có độ dài từ 1 đến 50 ký tự");
        }
        
        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }
    }

    private void validateDuplicate(String deptName, UUID parentDepartmentId, UUID currentId) {
        boolean existed;
        if (parentDepartmentId == null) {
            existed = currentId == null
                    ? departmentRepository.existsByDeptNameAndParentDepartmentIsNull(deptName)
                    : departmentRepository.existsByDeptNameAndParentDepartmentIsNullAndIdNot(deptName, currentId);
        } else {
            existed = currentId == null
                    ? departmentRepository.existsByDeptNameAndParentDepartment_Id(deptName, parentDepartmentId)
                    : departmentRepository.existsByDeptNameAndParentDepartment_IdAndIdNot(deptName, parentDepartmentId,
                            currentId);
        }

        if (existed) {
            throw new AppValidationException(
                Map.of("deptName", parentDepartmentId == null ? "Tên phòng/Đơn vị đã tồn tại" : "Tên phòng ban/bộ phận đã tồn tại")
            );
        }
    }

    private void adjustDepartmentDepth(DepartmentUpsertRequest request) {
        if (request.getParentDepartmentId() == null) return;
        
        Department targetParent = departmentRepository.findById(request.getParentDepartmentId()).orElse(null);
        if (targetParent == null) return;
        
        int depth = 1;
        Department curr = targetParent;
        while (curr != null && curr.getParentDepartment() != null) {
            depth++;
            curr = curr.getParentDepartment();
        }
        
        if (depth >= 4) {
            Department hoistedParent = targetParent;
            while (depth >= 4 && hoistedParent.getParentDepartment() != null) {
                hoistedParent = hoistedParent.getParentDepartment();
                depth--;
            }
            request.setParentDepartmentId(hoistedParent.getId());
        }
    }

    private Department getDepartment(UUID id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
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

    public List<UUID> getAllSubDepartmentIds(UUID rootDeptId) {
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
}
