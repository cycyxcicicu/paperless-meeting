package vn.acme.paperless_meeting.service.department;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.department.DepartmentMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DepartmentService {
    DepartmentRepository departmentRepository;
    DepartmentMapper departmentMapper;

    public List<DepartmentResponse> findAll() {
        return departmentRepository.findAll().stream()
                .map(departmentMapper::toResponse)
                .toList();
    }

    public DepartmentResponse findById(UUID id) {
        return departmentMapper.toResponse(getDepartment(id));
    }

    public DepartmentResponse create(DepartmentUpsertRequest request) {
        validateDuplicate(request.getDeptName(), request.getParentDepartmentId(), null);

        Department department = departmentMapper.toEntity(request);
        setParentDepartment(department, request.getParentDepartmentId());

        return departmentMapper.toResponse(departmentRepository.save(department));
    }

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

    public void delete(UUID id) {
        Department department = getDepartment(id);
        departmentRepository.delete(department);
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
