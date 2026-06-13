package vn.acme.paperless_meeting.service.location;

import java.util.ArrayList;
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
import vn.acme.paperless_meeting.dto.response.location.LocationStatsResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.User;

import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.location.LocationMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.LocationRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.specification.location.LocationSpecification;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationService {
    LocationRepository locationRepository;
    LocationMapper locationMapper;
    CurrentUserService currentUserService;
    DepartmentRepository departmentRepository;
    DepartmentService departmentService;

    @Transactional(readOnly = true)
    public PageResponse<LocationResponse> findAll(String keyword, Boolean isActive, UUID departmentId, Pageable pageable) {
        if (pageable.getPageNumber() < 0 || pageable.getPageSize() <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        User caller = currentUserService.getCurrentActiveUser();
        List<UUID> allowedDeptIds = null;

        boolean includeShared = true;

        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            if (!hasViewPermission()) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }

            if (departmentId == null) {
                allowedDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
            } else {
                if (!departmentService.getAllSubDepartmentIds(caller.getDepartment().getId()).contains(departmentId)) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
                allowedDeptIds = List.of(departmentId);
                includeShared = false;
            }
        } else {
            if (departmentId != null) {
                allowedDeptIds = List.of(departmentId);
                includeShared = false;
            } else {
                allowedDeptIds = new ArrayList<>(); // Empty list to trigger only shared rooms in Specification
            }
        }

        Specification<Location> spec = LocationSpecification.build(keyword, isActive, allowedDeptIds, includeShared);
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

    @Transactional(readOnly = true)
    public LocationStatsResponse getStats(UUID departmentId) {
        User caller = currentUserService.getCurrentActiveUser();
        List<UUID> allowedDeptIds = null;
        boolean includeShared = true;

        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            if (!hasViewPermission()) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
            }

            if (departmentId == null) {
                allowedDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
            } else {
                if (!departmentService.getAllSubDepartmentIds(caller.getDepartment().getId()).contains(departmentId)) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
                allowedDeptIds = List.of(departmentId);
                includeShared = false;
            }
        } else {
            if (departmentId != null) {
                allowedDeptIds = List.of(departmentId);
                includeShared = false;
            } else {
                allowedDeptIds = new ArrayList<>();
            }
        }

        return locationRepository.getStats(allowedDeptIds, includeShared);
    }

    public LocationResponse findById(UUID id) {
        Location location = getLocation(id);
        User caller = currentUserService.getCurrentActiveUser();
        
        UUID deptId = location.getDepartment() != null ? location.getDepartment().getId() : null;
        requireAccessToDepartment(caller, deptId, false);

        return locationMapper.toResponse(location);
    }

    public LocationResponse create(LocationUpsertRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        UUID reqDeptId = request.getDepartmentId();

        if (!currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            if (!hasManagePermission()) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            if (reqDeptId == null) {
                if (caller.getDepartment() == null) {
                    throw new AppException(ErrorCode.DEPARTMENT_ID_REQUIRED);
                }
                reqDeptId = caller.getDepartment().getId();
            } else {
                requireAccessToDepartment(caller, reqDeptId, true);
            }
        }

        Department dept = null;
        if (reqDeptId != null) {
            dept = departmentRepository.findById(reqDeptId)
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
        }

        Location location = locationMapper.toEntity(request);
        location.setDepartment(dept);

        return locationMapper.toResponse(locationRepository.save(location));
    }

    public LocationResponse update(UUID id, LocationUpsertRequest request) {
        Location location = getLocation(id);
        User caller = currentUserService.getCurrentActiveUser();

        UUID currentDeptId = location.getDepartment() != null ? location.getDepartment().getId() : null;
        requireAccessToDepartment(caller, currentDeptId, true);

        UUID reqDeptId = request.getDepartmentId();
        if (reqDeptId == null) {
            if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
                location.setDepartment(null);
            }
        } else if (!reqDeptId.equals(currentDeptId)) {
            requireAccessToDepartment(caller, reqDeptId, true);
            Department dept = departmentRepository.findById(reqDeptId)
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
            location.setDepartment(dept);
        }

        locationMapper.updateEntity(request, location);
        return locationMapper.toResponse(locationRepository.save(location));
    }

    public void delete(UUID id) {
        Location location = getLocation(id);
        User caller = currentUserService.getCurrentActiveUser();

        UUID currentDeptId = location.getDepartment() != null ? location.getDepartment().getId() : null;
        requireAccessToDepartment(caller, currentDeptId, true);

        locationRepository.delete(location);
    }

    private Location getLocation(UUID id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_EXIST));
    }

    private boolean hasViewPermission() {
        return true;
    }

    private boolean hasManagePermission() {
        return currentUserService.hasRole(RoleName.SUPER_ADMIN) ||
               currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) ||
               currentUserService.hasAuthority("LOCATION_MANAGE_DEPARTMENT");
    }

    private void requireAccessToDepartment(User caller, UUID targetDeptId, boolean isManage) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) return;

        // If target has no department (shared), anyone with view permission can see it
        // but only SUPER_ADMIN can manage it
        if (targetDeptId == null) {
            if (isManage) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            } else {
                if (!hasViewPermission()) {
                    throw new AppException(ErrorCode.UNAUTHOZIZED);
                }
                return; // Allowed to view
            }
        }

        boolean hasPermission = isManage ? hasManagePermission() : hasViewPermission();
        if (hasPermission) {
            if (caller.getDepartment() == null) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            if (!departmentService.getAllSubDepartmentIds(caller.getDepartment().getId()).contains(targetDeptId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            return;
        }
        throw new AppException(ErrorCode.UNAUTHOZIZED);
    }
}
