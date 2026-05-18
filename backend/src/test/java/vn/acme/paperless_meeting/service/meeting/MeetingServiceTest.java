package vn.acme.paperless_meeting.service.meeting;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import vn.acme.paperless_meeting.dto.request.meeting.MeetingUpsertRequest;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.*;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.meeting.MeetingMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.LocationRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MeetingServiceTest {

    @Mock
    MeetingRepository meetingRepository;
    @Mock
    MeetingMapper meetingMapper;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    DepartmentRepository departmentRepository;
    @Mock
    DepartmentService departmentService;
    @Mock
    LocationRepository locationRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    MeetingParticipantRepository meetingParticipantRepository;

    @InjectMocks
    MeetingService meetingService;

    private User caller;
    private Department department;
    private Location location;
    private Meeting meeting;
    private MeetingUpsertRequest request;
    private UUID meetingId;
    private UUID departmentId;
    private UUID locationId;

    @BeforeEach
    void setUp() {
        meetingId = UUID.randomUUID();
        departmentId = UUID.randomUUID();
        locationId = UUID.randomUUID();

        caller = new User();
        caller.setId(UUID.randomUUID());
        
        department = new Department();
        department.setId(departmentId);
        department.setDeptName("Dept A");
        caller.setDepartment(department);

        location = new Location();
        location.setId(locationId);
        location.setName("Room 101");

        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setCreatedBy(caller);
        meeting.setDepartment(department);
        meeting.setLocation(location);
        meeting.setStatus(MeetingStatus.DRAFT);
        meeting.setMeetingParticipantList(new ArrayList<>());

        request = new MeetingUpsertRequest();
        request.setDepartmentId(departmentId);
        request.setLocationId(locationId);
        request.setStartTime(LocalDateTime.now().plusMinutes(60));
        request.setEndTime(LocalDateTime.now().plusMinutes(120));
        request.setLateAfterMinutes(15);

        lenient().when(currentUserService.hasAuthority("MEETING_CREATE")).thenReturn(true);
    }

    @Test
    void create_WhenTimeInvalid_ShouldThrowException() {
        // Arrange
        request.setEndTime(request.getStartTime().minusMinutes(10)); // End before start

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.create(request);
        });
        assertEquals(ErrorCode.MEETING_INVALID_TIME_RANGE, ex.getErrorCode());
    }

    @Test
    void create_WhenTimeTooClose_ShouldThrowException() {
        // Arrange
        request.setStartTime(LocalDateTime.now().plusMinutes(10)); // Less than 30 mins in future
        request.setEndTime(LocalDateTime.now().plusMinutes(40));

        lenient().when(currentUserService.hasAuthority("MEETING_CREATE")).thenReturn(true);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.create(request);
        });
        assertEquals(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES, ex.getErrorCode());
    }

    @Test
    void create_WhenRoomConflict_ShouldThrowException() {
        // Arrange
        request.setStartTime(LocalDateTime.now().plusMinutes(60));
        request.setEndTime(LocalDateTime.now().plusMinutes(120));

        when(currentUserService.hasAuthority("MEETING_CREATE")).thenReturn(true);
        when(meetingRepository.existsRoomConflict(any(), any(), any(), any(), any())).thenReturn(true);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.create(request);
        });
        assertEquals(ErrorCode.MEETING_LOCATION_TIME_CONFLICT, ex.getErrorCode());
    }

    @Test
    void create_Successful_ShouldAutomaticallyAddCreatorAsSecretary() {
        // Arrange
        when(currentUserService.hasAuthority("MEETING_CREATE")).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));
        when(locationRepository.findById(locationId)).thenReturn(Optional.of(location));
        when(meetingMapper.toEntity(request)).thenReturn(meeting);
        when(meetingRepository.save(meeting)).thenReturn(meeting);
        when(meetingMapper.toResponse(meeting)).thenReturn(MeetingResponse.builder().build());

        // Act
        MeetingResponse response = meetingService.create(request);

        // Assert
        assertNotNull(response);
        verify(meetingParticipantRepository, times(1)).save(argThat(p -> 
            p.getUser().equals(caller) &&
            p.getParticipantRole() == ParticipantRole.SECRETARY &&
            p.getInviteStatus() == InviteStatus.ACCEPTED
        ));
    }

    @Test
    void submitForApproval_WhenNoChair_ShouldThrowException() {
        // Arrange
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(0L);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.submitForApproval(meetingId);
        });
        assertEquals(ErrorCode.MEETING_CHAIR_REQUIRED, ex.getErrorCode());
    }

    @Test
    void submitForApproval_WhenNoSecretary_ShouldThrowException() {
        // Arrange
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(1L);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.SECRETARY)).thenReturn(0L);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.submitForApproval(meetingId);
        });
        assertEquals(ErrorCode.MEETING_SECRETARY_REQUIRED, ex.getErrorCode());
    }

    @Test
    void submitForApproval_WhenChairGreaterThan3_ShouldThrowException() {
        // Arrange
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(4L); // > 3 Chairs

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.submitForApproval(meetingId);
        });
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }

    @Test
    void submitForApproval_Successful_ShouldTransitionToPendingApproval() {
        // Arrange
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(2L);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.SECRETARY)).thenReturn(1L);

        // Act
        meetingService.submitForApproval(meetingId);

        // Assert
        assertEquals(MeetingStatus.PENDING_APPROVAL, meeting.getStatus());
        verify(meetingRepository, times(1)).save(meeting);
    }

    @Test
    void approve_Successful_ShouldTransitionToApproved() {
        // Arrange
        meeting.setStatus(MeetingStatus.PENDING_APPROVAL);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentService.getAllSubDepartmentIds(departmentId)).thenReturn(List.of(departmentId));

        // Act
        meetingService.approve(meetingId);

        // Assert
        assertEquals(MeetingStatus.APPROVED, meeting.getStatus());
        assertEquals(caller, meeting.getApprovedBy());
        assertNotNull(meeting.getApprovedAt());
        verify(meetingRepository, times(1)).save(meeting);
    }

    @Test
    void reject_WhenReasonEmpty_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.PENDING_APPROVAL);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentService.getAllSubDepartmentIds(departmentId)).thenReturn(List.of(departmentId));

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.reject(meetingId, "");
        });
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }

    @Test
    void cancel_WhenStatusInvalid_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.CLOSED); // Cannot cancel closed meeting
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.cancel(meetingId, "Reason");
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }
}
