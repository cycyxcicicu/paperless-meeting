package vn.acme.paperless_meeting.service.department;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.department.DepartmentMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DepartmentService {
    DepartmentRepository departmentRepository;
    DepartmentMapper departmentMapper;
    CurrentUserService currentUserService;

    @PreAuthorize("hasRole('SUPER_ADMIN')")
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

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public DepartmentResponse findById(UUID id) {
        return departmentMapper.toResponse(getDepartment(id));
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public DepartmentResponse create(DepartmentUpsertRequest request) {
        validateDuplicate(request.getDeptName(), request.getParentDepartmentId(), null);

        Department department = departmentMapper.toEntity(request);

        setParentDepartment(department, request.getParentDepartmentId());

        return departmentMapper.toResponse(departmentRepository.save(department));
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public DepartmentResponse update(UUID id, DepartmentUpsertRequest request) {
        Department department = getDepartment(id);

        if (request.getParentDepartmentId() != null && request.getParentDepartmentId().equals(id)) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        validateDuplicate(request.getDeptName(), request.getParentDepartmentId(), id);
        departmentMapper.updateEntity(request, department);
        setParentDepartment(department, request.getParentDepartmentId());

        return departmentMapper.toResponse(departmentRepository.save(department));
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void delete(UUID id) {
        getDepartment(id); // ensure exists

        User caller = currentUserService.getCurrentActiveUser();
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
}
