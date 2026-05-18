package vn.acme.paperless_meeting.service.position;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.position.PositionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.position.PositionMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PositionService {

    PositionRepository positionRepository;
    DepartmentRepository departmentRepository;
    PositionMapper positionMapper;
    CurrentUserService currentUserService;
    DepartmentService departmentService;

    public List<PositionResponse> findAll() {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // SUPER_ADMIN: only sees system positions by default
            return positionRepository.findByDepartmentIsNull().stream()
                    .map(positionMapper::toResponseWithDepartment)
                    .toList();
        } else {
            // DEPARTMENT_ADMIN: sees system positions + their allowed department positions
            User caller = currentUserService.getCurrentActiveUser();
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                return List.of(); // No access
            }
            List<UUID> allowedDeptIds = departmentService.getAllSubDepartmentIds(callerDeptId);
            return positionRepository.findSystemAndAllowedPositions(allowedDeptIds).stream()
                    .map(positionMapper::toResponseWithDepartment)
                    .toList();
        }
    }

    public PositionResponse findById(UUID id) {
        return positionMapper.toResponseWithDepartment(getPosition(id));
    }
    public List<PositionResponse> findByDepartmentId(UUID departmentId) {
        // Validate department exists
        departmentRepository.findById(departmentId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));

        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            User caller = currentUserService.getCurrentActiveUser();
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null || !departmentService.getAllSubDepartmentIds(callerDeptId).contains(departmentId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        // Return both System positions (null) and this specific department's positions
        return positionRepository.findSystemAndAllowedPositions(List.of(departmentId)).stream()
                .map(positionMapper::toResponseWithDepartment)
                .toList();
    }


    @Transactional
    public PositionResponse create(PositionUpsertRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        // Lấy departmentId từ người tạo thay vì từ request
        UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;

        Department department = null;
        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            if (callerDeptId == null) {
                // DEPARTMENT_ADMIN phải thuộc một phòng ban
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            department = caller.getDepartment();
        } else {
            // SUPER_ADMIN: nếu có phòng ban thì gán, không thì tạo position hệ thống (department = null)
            if (callerDeptId != null) {
                department = caller.getDepartment();
            }
        }

        // Validate duplicates
        Map<String, String> errors = new HashMap<>();

        boolean existsCode = department == null 
            ? positionRepository.existsByPositionCodeAndDepartmentIsNull(request.getPositionCode())
            : positionRepository.existsByPositionCodeAndDepartmentId(request.getPositionCode(), department.getId());
        
        if (existsCode) {
            errors.put("positionCode", ErrorCode.POSITION_EXISTED.getMessage());
        }

        boolean existsName = department == null 
            ? positionRepository.existsByPositionNameAndDepartmentIsNull(request.getPositionName())
            : positionRepository.existsByPositionNameAndDepartmentId(request.getPositionName(), department.getId());

        if (existsName) {
            errors.put("positionName", ErrorCode.POSITION_EXISTED.getMessage());
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }

        // Create entity
        Position position = positionMapper.toEntity(request);
        position.setDepartment(department);
        position.setCreatedAt(LocalDateTime.now());
        position.setUpdatedAt(LocalDateTime.now());
        position.setIsDeleted(false);

        return positionMapper.toResponseWithDepartment(positionRepository.save(position));
    }


    @Transactional
    public PositionResponse update(UUID id, PositionUpsertRequest request) {
        Position position = getPosition(id);
        User caller = currentUserService.getCurrentActiveUser();
        UUID currentDeptId = position.getDepartment() != null ? position.getDepartment().getId() : null;

        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            if (currentDeptId == null) {
                // DEPARTMENT_ADMIN không thể cập nhật position hệ thống
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            requireAccessToDepartment(caller, currentDeptId);
        }

        // Validate duplicates (excluding current position) — giữ nguyên department của position
        Map<String, String> errors = new HashMap<>();

        boolean existsCode = currentDeptId == null 
            ? positionRepository.existsByPositionCodeAndDepartmentIsNullAndIdNot(request.getPositionCode(), id)
            : positionRepository.existsByPositionCodeAndDepartmentIdAndIdNot(request.getPositionCode(), currentDeptId, id);

        if (existsCode) {
            errors.put("positionCode", ErrorCode.POSITION_EXISTED.getMessage());
        }

        boolean existsName = currentDeptId == null 
            ? positionRepository.existsByPositionNameAndDepartmentIsNullAndIdNot(request.getPositionName(), id)
            : positionRepository.existsByPositionNameAndDepartmentIdAndIdNot(request.getPositionName(), currentDeptId, id);

        if (existsName) {
            errors.put("positionName", ErrorCode.POSITION_EXISTED.getMessage());
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }

        // Update entity — không thay đổi department
        positionMapper.updateEntity(request, position);
        position.setUpdatedAt(LocalDateTime.now());

        return positionMapper.toResponseWithDepartment(positionRepository.save(position));
    }

    @Transactional
    public void delete(UUID id) {
        Position position = getPosition(id);
        
        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            UUID currentDeptId = position.getDepartment() != null ? position.getDepartment().getId() : null;
            if (currentDeptId == null) {
                // DEPARTMENT_ADMIN cannot delete system-wide positions
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            User caller = currentUserService.getCurrentActiveUser();
            requireAccessToDepartment(caller, currentDeptId);
        }

        positionRepository.delete(position);
    }

    private Position getPosition(UUID id) {
        return positionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POSITION_NOT_EXIST));
    }

    private void requireAccessToDepartment(User caller, UUID targetDeptId) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) return;
        UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
        if (callerDeptId == null) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
        if (!departmentService.getAllSubDepartmentIds(callerDeptId).contains(targetDeptId)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
    }
}