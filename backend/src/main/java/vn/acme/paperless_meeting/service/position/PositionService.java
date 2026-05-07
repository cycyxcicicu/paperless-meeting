package vn.acme.paperless_meeting.service.position;

import java.time.LocalDateTime;
import java.util.List;
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
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.position.PositionMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.PositionRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PositionService {

    PositionRepository positionRepository;
    DepartmentRepository departmentRepository;
    PositionMapper positionMapper;

    /**
     * Get all positions (soft-deleted entries are auto-excluded by @SQLRestriction)
     */
    public List<PositionResponse> findAll() {
        return positionRepository.findAll().stream()
                .map(positionMapper::toResponseWithDepartment)
                .toList();
    }

    /**
     * Get position by id (soft-deleted entries are auto-excluded
     * by @SQLRestriction)
     */
    public PositionResponse findById(UUID id) {
        return positionMapper.toResponseWithDepartment(getPosition(id));
    }

    /**
     * Get all positions of a department (soft-deleted entries are auto-excluded
     * by @SQLRestriction)
     */
    public List<PositionResponse> findByDepartmentId(UUID departmentId) {
        // Validate department exists
        departmentRepository.findById(departmentId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));

        return positionRepository.findByDepartmentIdOrdered(departmentId).stream()
                .map(positionMapper::toResponseWithDepartment)
                .toList();
    }

    /**
     * Create new position
     */
    @Transactional
    public PositionResponse create(PositionUpsertRequest request) {
        // Validate department exists
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));

        // Validate duplicates
        if (positionRepository.existsByPositionCodeAndDepartmentId(request.getPositionCode(),
                request.getDepartmentId())) {
            throw new AppException(ErrorCode.POSITION_EXISTED);
        }

        if (positionRepository.existsByPositionNameAndDepartmentId(request.getPositionName(),
                request.getDepartmentId())) {
            throw new AppException(ErrorCode.POSITION_EXISTED);
        }

        // Create entity
        Position position = positionMapper.toEntity(request);
        position.setDepartment(department);
        position.setCreatedAt(LocalDateTime.now());
        position.setUpdatedAt(LocalDateTime.now());
        position.setIsDeleted(false);

        return positionMapper.toResponseWithDepartment(positionRepository.save(position));
    }

    /**
     * Update position
     */
    @Transactional
    public PositionResponse update(UUID id, PositionUpsertRequest request) {
        Position position = getPosition(id);

        // Validate department exists if changed
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));

        // Validate duplicates (excluding current position)
        if (positionRepository.existsByPositionCodeAndDepartmentIdAndIdNot(
                request.getPositionCode(), request.getDepartmentId(), id)) {
            throw new AppException(ErrorCode.POSITION_EXISTED);
        }

        if (positionRepository.existsByPositionNameAndDepartmentIdAndIdNot(
                request.getPositionName(), request.getDepartmentId(), id)) {
            throw new AppException(ErrorCode.POSITION_EXISTED);
        }

        // Update entity
        positionMapper.updateEntity(request, position);
        position.setDepartment(department);
        position.setUpdatedAt(LocalDateTime.now());

        return positionMapper.toResponseWithDepartment(positionRepository.save(position));
    }

    /**
     * Delete position (soft delete with audit trail)
     */
    @Transactional
    public void delete(UUID id) {
        Position position = getPosition(id);
        positionRepository.delete(position);
    }

    /**
     * Get position entity or throw exception
     */
    private Position getPosition(UUID id) {
        return positionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POSITION_NOT_EXIST));
    }
}