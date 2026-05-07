package vn.acme.paperless_meeting.service.location;

import java.util.List;
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
import vn.acme.paperless_meeting.dto.request.location.LocationUpsertRequest;
import vn.acme.paperless_meeting.dto.response.location.LocationResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.LocationType;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.location.LocationMapper;
import vn.acme.paperless_meeting.repository.LocationRepository;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.specification.location.LocationSpecification;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationService {
    LocationRepository locationRepository;
    LocationMapper locationMapper;
    CurrentUserService currentUserService;
    DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public PageResponse<LocationResponse> findAll(String keyword, String typeStr, Pageable pageable) {
        if (pageable.getPageNumber() < 0) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        if (pageable.getPageSize() <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        User caller = currentUserService.getCurrentActiveUser();
        UUID departmentId = null;

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // allowed: no department restriction
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }
            departmentId = caller.getDepartment().getId();
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        LocationType type = null;
        if (typeStr != null && !typeStr.isBlank()) {
            try {
                type = LocationType.valueOf(typeStr.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
        }

        Specification<Location> spec = LocationSpecification.build(keyword, type, departmentId);

        Page<Location> page = locationRepository.findAll(spec, pageable);

        List<LocationResponse> content = page.getContent().stream()
                .map(locationMapper::toResponse)
                .toList();

        return PageResponse.<LocationResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public LocationResponse findById(UUID id) {
        Location location = getLocation(id);

        // Authorization: SUPER_ADMIN can view any; DEPARTMENT_ADMIN only for their department; others forbidden
        var caller = currentUserService.getCurrentActiveUser();
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // allowed
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }
            UUID adminDeptId = caller.getDepartment().getId();

            if (location.getDepartment() == null || !adminDeptId.equals(location.getDepartment().getId())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        return locationMapper.toResponse(location);
    }

    public LocationResponse create(LocationUpsertRequest request) {
        User caller = currentUserService.getCurrentActiveUser();

        if (currentUserService.hasRole(RoleName.USER)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        UUID reqDeptId = request.getDepartmentId();
        Department dept = null;

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            if (reqDeptId != null) {
                dept = departmentRepository.findById(reqDeptId)
                        .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
            }
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }
            UUID adminDeptId = caller.getDepartment().getId();

            if (reqDeptId == null) {
                dept = departmentRepository.findById(adminDeptId)
                        .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
            } else if (!adminDeptId.equals(reqDeptId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            } else {
                dept = departmentRepository.findById(reqDeptId)
                        .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
            }
        }

        Location location = locationMapper.toEntity(request);
        location.setDepartment(dept);

        return locationMapper.toResponse(locationRepository.save(location));
    }

    public LocationResponse update(UUID id, LocationUpsertRequest request) {
        Location location = getLocation(id);
        User caller = currentUserService.getCurrentActiveUser();

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // allowed
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }
            UUID adminDeptId = caller.getDepartment().getId();

            if (location.getDepartment() == null || !adminDeptId.equals(location.getDepartment().getId())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        UUID reqDeptId = request.getDepartmentId();
        if (reqDeptId != null) {
            Department dept = departmentRepository.findById(reqDeptId)
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));

            if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
                if (caller.getDepartment() == null) {
                    throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
                }
                UUID adminDeptId = caller.getDepartment().getId();

                if (!adminDeptId.equals(reqDeptId)) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
            }

            location.setDepartment(dept);
        }

        locationMapper.updateEntity(request, location);
        return locationMapper.toResponse(locationRepository.save(location));
    }

    public void delete(UUID id) {
        Location location = getLocation(id);
        User caller = currentUserService.getCurrentActiveUser();

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // allowed
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }
            UUID adminDeptId = caller.getDepartment().getId();

            if (location.getDepartment() == null || !adminDeptId.equals(location.getDepartment().getId())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        locationRepository.delete(location);
    }

    private Location getLocation(UUID id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_EXIST));
    }
}
