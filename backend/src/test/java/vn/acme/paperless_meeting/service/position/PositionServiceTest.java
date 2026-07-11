package vn.acme.paperless_meeting.service.position;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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

import vn.acme.paperless_meeting.dto.base.PageResponse;
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
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;

@ExtendWith(MockitoExtension.class)
class PositionServiceTest {

    @Mock
    PositionRepository positionRepository;
    @Mock
    DepartmentRepository departmentRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    PositionMapper positionMapper;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    DepartmentService departmentService;
    @Mock
    AuditLogPublisher auditLogPublisher;

    @InjectMocks
    PositionService positionService;

    private User caller;
    private Department callerDept;
    private Position systemPosition;
    private Position deptPosition;

    @BeforeEach
    void setUp() {
        caller = new User();
        caller.setId(UUID.randomUUID());

        callerDept = new Department();
        callerDept.setId(UUID.randomUUID());
        callerDept.setDeptName("Sở Kế Hoạch");
        caller.setDepartment(callerDept);

        systemPosition = new Position();
        systemPosition.setId(UUID.randomUUID());
        systemPosition.setPositionName("Chuyên viên");
        systemPosition.setPositionCode("CV");
        systemPosition.setDepartment(null);

        deptPosition = new Position();
        deptPosition.setId(UUID.randomUUID());
        deptPosition.setPositionName("Trưởng phòng chuyên môn");
        deptPosition.setPositionCode("TPCM");
        deptPosition.setDepartment(callerDept);
    }

    @Test
    void findAll_asSuperAdmin_shouldReturnSystemPositions() {
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Position> page = new PageImpl<>(List.of(systemPosition));
        when(positionRepository.findSystemPositionsWithSearch("CV", pageable)).thenReturn(page);

        PositionResponse responseDto = PositionResponse.builder()
                .id(systemPosition.getId())
                .positionName("Chuyên viên")
                .positionCode("CV")
                .build();
        when(positionMapper.toResponseWithDepartment(systemPosition)).thenReturn(responseDto);

        PageResponse<PositionResponse> result = positionService.findAll("CV", pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("CV", result.getContent().get(0).getPositionCode());
    }

    @Test
    void create_asSuperAdmin_shouldCreateSystemPosition() {
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);

        PositionUpsertRequest request = new PositionUpsertRequest();
        request.setPositionName("Chuyên viên chính");
        request.setPositionCode("CVC");

        when(positionRepository.existsByPositionCodeAndDepartmentIsNull("CVC")).thenReturn(false);
        when(positionRepository.existsByPositionNameAndDepartmentIsNull("Chuyên viên chính")).thenReturn(false);

        Position saved = new Position();
        saved.setId(UUID.randomUUID());
        saved.setPositionName("Chuyên viên chính");
        saved.setPositionCode("CVC");
        saved.setDepartment(null);

        when(positionMapper.toEntity(request)).thenReturn(saved);
        when(positionRepository.save(any(Position.class))).thenReturn(saved);

        PositionResponse responseDto = PositionResponse.builder()
                .id(saved.getId())
                .positionName("Chuyên viên chính")
                .positionCode("CVC")
                .build();
        when(positionMapper.toResponseWithDepartment(saved)).thenReturn(responseDto);

        PositionResponse result = positionService.create(request);

        assertNotNull(result);
        assertEquals("CVC", result.getPositionCode());
        verify(auditLogPublisher, times(1)).publish(any(), any(), any(), any(), any());
    }

    @Test
    void create_asDepartmentAdmin_withDuplicateCode_shouldThrowValidationException() {
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        PositionUpsertRequest request = new PositionUpsertRequest();
        request.setPositionName("Trưởng phòng chuyên môn");
        request.setPositionCode("TPCM");

        // Code exists in department
        when(positionRepository.existsByPositionCodeAndDepartmentIsNull("TPCM")).thenReturn(false);
        when(positionRepository.existsByPositionCodeAndDepartmentId("TPCM", callerDept.getId())).thenReturn(true);

        assertThrows(AppValidationException.class, () -> positionService.create(request));
    }

    @Test
    void delete_whenPositionInUse_shouldThrowAppException() {
        when(positionRepository.findById(deptPosition.getId())).thenReturn(Optional.of(deptPosition));
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);
        when(userRepository.existsByPosition_Id(deptPosition.getId())).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> positionService.delete(deptPosition.getId()));
        assertEquals(ErrorCode.POSITION_IN_USE, exception.getErrorCode());
    }

    @Test
    void delete_asDepartmentAdmin_whenDeletingSystemPosition_shouldThrowUnauthorized() {
        when(positionRepository.findById(systemPosition.getId())).thenReturn(Optional.of(systemPosition));
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        assertThrows(AppException.class, () -> positionService.delete(systemPosition.getId()));
    }
}
