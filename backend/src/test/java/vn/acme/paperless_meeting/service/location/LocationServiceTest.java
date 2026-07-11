package vn.acme.paperless_meeting.service.location;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.location.LocationUpsertRequest;
import vn.acme.paperless_meeting.dto.response.location.LocationResponse;
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

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {

    @Mock
    LocationRepository locationRepository;
    @Mock
    LocationMapper locationMapper;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    DepartmentRepository departmentRepository;
    @Mock
    DepartmentService departmentService;

    @InjectMocks
    LocationService locationService;

    private User caller;
    private Department callerDept;
    private Location sharedLocation;
    private Location deptLocation;

    @BeforeEach
    void setUp() {
        caller = new User();
        caller.setId(UUID.randomUUID());

        callerDept = new Department();
        callerDept.setId(UUID.randomUUID());
        callerDept.setDeptName("Sở Thông Tin Truyền Thông");
        caller.setDepartment(callerDept);

        sharedLocation = new Location();
        sharedLocation.setId(UUID.randomUUID());
        sharedLocation.setName("Hội trường Thành phố");
        sharedLocation.setDepartment(null);

        deptLocation = new Location();
        deptLocation.setId(UUID.randomUUID());
        deptLocation.setName("Phòng họp số 3 Sở TTTT");
        deptLocation.setDepartment(callerDept);
    }

    @Test
    void findAll_asSuperAdmin_shouldSucceed() {
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Location> page = new PageImpl<>(List.of(sharedLocation));
        when(locationRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        LocationResponse responseDto = LocationResponse.builder()
                .id(sharedLocation.getId())
                .name("Hội trường Thành phố")
                .build();
        when(locationMapper.toResponse(sharedLocation)).thenReturn(responseDto);

        PageResponse<LocationResponse> result = locationService.findAll(null, null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Hội trường Thành phố", result.getContent().get(0).getName());
    }

    @Test
    void create_asSuperAdmin_shouldCreateSharedLocation() {
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);

        LocationUpsertRequest request = new LocationUpsertRequest();
        request.setName("Phòng họp lớn UBND");
        request.setDepartmentId(null);

        Location saved = new Location();
        saved.setId(UUID.randomUUID());
        saved.setName("Phòng họp lớn UBND");
        saved.setDepartment(null);

        when(locationMapper.toEntity(request)).thenReturn(saved);
        when(locationRepository.save(any(Location.class))).thenReturn(saved);

        LocationResponse responseDto = LocationResponse.builder()
                .id(saved.getId())
                .name("Phòng họp lớn UBND")
                .build();
        when(locationMapper.toResponse(saved)).thenReturn(responseDto);

        LocationResponse result = locationService.create(request);

        assertNotNull(result);
        assertEquals("Phòng họp lớn UBND", result.getName());
    }

    @Test
    void create_asDepartmentAdmin_withinOwnSubtree_shouldSucceed() {
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Mock hasManagePermission checks
        when(currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)).thenReturn(true);

        // department access mock
        when(departmentService.getAllSubDepartmentIds(callerDept.getId()))
                .thenReturn(List.of(callerDept.getId()));

        LocationUpsertRequest request = new LocationUpsertRequest();
        request.setName("Phòng họp mới");
        request.setDepartmentId(callerDept.getId());

        when(departmentRepository.findById(callerDept.getId())).thenReturn(Optional.of(callerDept));

        Location saved = new Location();
        saved.setId(UUID.randomUUID());
        saved.setName("Phòng họp mới");
        saved.setDepartment(callerDept);

        when(locationMapper.toEntity(request)).thenReturn(saved);
        when(locationRepository.save(any(Location.class))).thenReturn(saved);

        LocationResponse responseDto = LocationResponse.builder()
                .id(saved.getId())
                .name("Phòng họp mới")
                .build();
        when(locationMapper.toResponse(saved)).thenReturn(responseDto);

        LocationResponse result = locationService.create(request);

        assertNotNull(result);
        assertEquals("Phòng họp mới", result.getName());
    }

    @Test
    void delete_asDepartmentAdmin_whenDeletingSharedLocation_shouldThrowUnauthorized() {
        when(locationRepository.findById(sharedLocation.getId())).thenReturn(Optional.of(sharedLocation));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        assertThrows(AppException.class, () -> locationService.delete(sharedLocation.getId()));
    }
}
