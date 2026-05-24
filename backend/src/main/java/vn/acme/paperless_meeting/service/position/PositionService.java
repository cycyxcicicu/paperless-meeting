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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.position.PositionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.dto.response.position.PositionStatsResponse;
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
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PositionService {

    PositionRepository positionRepository;
    DepartmentRepository departmentRepository;
    UserRepository userRepository;
    PositionMapper positionMapper;
    CurrentUserService currentUserService;
    DepartmentService departmentService;

    public PageResponse<PositionResponse> findAll(String search, Pageable pageable) {
        Page<Position> pageData;
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // SUPER_ADMIN: mặc định chỉ thấy trạng thái hệ thống (chức vụ dùng chung)
            pageData = positionRepository.findSystemPositionsWithSearch(search, pageable);
        } else {
            // DEPARTMENT_ADMIN: thấy các chức vụ dùng chung + các chức vụ thuộc đơn vị quản lý
            User caller = currentUserService.getCurrentActiveUser();
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                return PageResponse.<PositionResponse>builder()
                        .content(List.of())
                        .page(pageable.getPageNumber())
                        .size(pageable.getPageSize())
                        .totalElements(0)
                        .totalPages(0)
                        .last(true)
                        .build();
            }
            List<UUID> allowedDeptIds = departmentService.getAllSubDepartmentIds(callerDeptId);
            pageData = positionRepository.findSystemAndAllowedPositionsWithSearch(allowedDeptIds, search, pageable);
        }

        List<PositionResponse> responses = pageData.getContent().stream()
                .map(positionMapper::toResponseWithDepartment)
                .toList();

        return PageResponse.<PositionResponse>builder()
                .content(responses)
                .page(pageData.getNumber())
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .build();
    }

    public PositionStatsResponse getStats() {
        long totalPositions = 0;
        long totalUsers = 0;

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            totalPositions = positionRepository.countByDepartmentIsNull(); 
            totalUsers = userRepository.countUsersWithPosition();
        } else {
            User caller = currentUserService.getCurrentActiveUser();
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId != null) {
                List<UUID> allowedDeptIds = departmentService.getAllSubDepartmentIds(callerDeptId);
                totalPositions = positionRepository.countSystemAndAllowedPositions(allowedDeptIds);
                totalUsers = userRepository.countUsersWithPositionInDepartments(allowedDeptIds);
            }
        }

        return PositionStatsResponse.builder()
                .totalPositions(totalPositions)
                .totalUsers(totalUsers)
                .build();
    }


    public PositionResponse findById(UUID id) {
        return positionMapper.toResponseWithDepartment(getPosition(id));
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
        }
        // SUPER_ADMIN luôn tạo chức vụ hệ thống (department = null) dù họ có thuộc phòng ban nào hay không.

        // Validate duplicates
        Map<String, String> errors = new HashMap<>();

        boolean existsCode = false;
        if (department == null) {
            existsCode = positionRepository.existsByPositionCodeAndDepartmentIsNull(request.getPositionCode());
        } else {
            existsCode = positionRepository.existsByPositionCodeAndDepartmentIsNull(request.getPositionCode()) ||
                         positionRepository.existsByPositionCodeAndDepartmentId(request.getPositionCode(), department.getId());
        }
        
        if (existsCode) {
            errors.put("positionCode", ErrorCode.POSITION_EXISTED.getMessage());
        }

        boolean existsName = false;
        if (department == null) {
            existsName = positionRepository.existsByPositionNameAndDepartmentIsNull(request.getPositionName());
        } else {
            existsName = positionRepository.existsByPositionNameAndDepartmentIsNull(request.getPositionName()) ||
                         positionRepository.existsByPositionNameAndDepartmentId(request.getPositionName(), department.getId());
        }

        if (existsName) {
            errors.put("positionName", ErrorCode.POSITION_EXISTED.getMessage());
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }

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

        // Kiểm tra trùng lặp dữ liệu (Ngoại trừ bản ghi hiện hành đang sửa)
        Map<String, String> errors = new HashMap<>();

        boolean existsCode = false;
        if (currentDeptId == null) {
            existsCode = positionRepository.existsByPositionCodeAndDepartmentIsNullAndIdNot(request.getPositionCode(), id);
        } else {
            // Không được trùng trùng với chức vụ hệ thống và không được trùng với chức vụ khác trong cùng Department hiện hành
            existsCode = positionRepository.existsByPositionCodeAndDepartmentIsNull(request.getPositionCode()) ||
                         positionRepository.existsByPositionCodeAndDepartmentIdAndIdNot(request.getPositionCode(), currentDeptId, id);
        }

        if (existsCode) {
            errors.put("positionCode", ErrorCode.POSITION_EXISTED.getMessage());
        }

        boolean existsName = false;
        if (currentDeptId == null) {
            existsName = positionRepository.existsByPositionNameAndDepartmentIsNullAndIdNot(request.getPositionName(), id);
        } else {
            existsName = positionRepository.existsByPositionNameAndDepartmentIsNull(request.getPositionName()) ||
                         positionRepository.existsByPositionNameAndDepartmentIdAndIdNot(request.getPositionName(), currentDeptId, id);
        }

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
                // Quản trị viên của Đơn vị không được phép can thiệp xóa các chức vụ hệ thống dùng chung
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            User caller = currentUserService.getCurrentActiveUser();
            requireAccessToDepartment(caller, currentDeptId);
        }

        if (userRepository.existsByPosition_Id(id)) {
            throw new AppException(ErrorCode.POSITION_IN_USE);
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