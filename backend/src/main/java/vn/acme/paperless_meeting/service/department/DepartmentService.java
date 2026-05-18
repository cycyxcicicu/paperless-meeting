package vn.acme.paperless_meeting.service.department;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.department.DepartmentMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.specification.department.DepartmentSpecification;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DepartmentService {
    DepartmentRepository departmentRepository;
    DepartmentMapper departmentMapper;
    CurrentUserService currentUserService;

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
    public PageResponse<DepartmentResponse> getChildrenPage(UUID parentId, String keyword, Pageable pageable) {
        User caller = currentUserService.getCurrentActiveUser();

        // Kiểm tra quyền
        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            if (parentId == null) {
                // DEPARTMENT_ADMIN không được xem gốc của toàn hệ thống (trừ khi gốc đó là Sở của họ, nhưng parentId=null nghĩa là root system)
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

        List<DepartmentResponse> content = page.getContent().stream()
                .map(departmentMapper::toResponse)
                .toList();

        return PageResponse.<DepartmentResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
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

        validateDuplicate(request.getDeptName(), request.getParentDepartmentId(), null);

        Department department = departmentMapper.toEntity(request);

        setParentDepartment(department, request.getParentDepartmentId());

        return departmentMapper.toResponse(departmentRepository.save(department));
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

        validateDuplicate(request.getDeptName(), request.getParentDepartmentId(), id);
        departmentMapper.updateEntity(request, department);
        setParentDepartment(department, request.getParentDepartmentId());

        return departmentMapper.toResponse(departmentRepository.save(department));
    }

    @Transactional
    public void delete(UUID id) {
        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        getDepartment(id); // ensure exists

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

        final int CHUNK = 500;
        for (int i = 0; i < allIds.size(); i += CHUNK) {
            List<UUID> chunk = allIds.subList(i, Math.min(i + CHUNK, allIds.size()));
            departmentRepository.softDeleteByIds(chunk, deletedBy);
        }

    }

    private void setParentDepartment(Department department, UUID parentDepartmentId) {
        Department parentDepartment = null;
        if (parentDepartmentId != null) {
            parentDepartment = getDepartment(parentDepartmentId);
        }
        department.setParentDepartment(parentDepartment);
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
            throw new AppException(ErrorCode.DEPARTMENT_EXISTED);
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
