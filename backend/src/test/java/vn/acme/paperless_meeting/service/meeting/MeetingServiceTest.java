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
import vn.acme.paperless_meeting.dto.response.approval.ApprovalRequestResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.*;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.meeting.MeetingMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.LocationRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.approval.ApprovalService;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.service.speaker.SpeakerService;
import org.springframework.test.util.ReflectionTestUtils;

import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MeetingServiceTest {

    @Mock
    AgendaItemRepository agendaItemRepository;
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
    @Mock
    ApprovalService approvalService;
    @Mock
    vn.acme.paperless_meeting.event.audit.AuditLogPublisher auditLogPublisher;
    @Mock
    SpeakerService speakerService;
    @Mock
    vn.acme.paperless_meeting.service.motion.MotionService motionService;
    @Mock
    RoleRepository roleRepository;
    @Mock
    vn.acme.paperless_meeting.repository.MeetingGuestRepository meetingGuestRepository;
    @Mock
    vn.acme.paperless_meeting.repository.DocTemplateRepository docTemplateRepository;
    @Mock
    vn.acme.paperless_meeting.service.notification.NotificationService notificationService;
    @Mock
    vn.acme.paperless_meeting.service.document.InvitationPdfService invitationPdfService;
    @Mock
    org.springframework.context.ApplicationEventPublisher eventPublisher;
    @Mock
    vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService webSocketNotificationService;

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
        meeting.setStartTime(LocalDateTime.now().plusMinutes(60));
        meeting.setEndTime(LocalDateTime.now().plusMinutes(120));
        meeting.setMeetingParticipantList(new ArrayList<>());

        request = new MeetingUpsertRequest();
        request.setDepartmentId(departmentId);
        request.setLocationId(locationId);
        request.setStartTime(LocalDateTime.now().plusMinutes(60));
        request.setEndTime(LocalDateTime.now().plusMinutes(120));
        request.setLateAfterMinutes(15);

        lenient().when(currentUserService.canCreateMeeting()).thenReturn(true);

        // Inject speakerService mock vào MeetingService (vì dùng setter injection, Mockito @InjectMocks không tự gọi setter)
        ReflectionTestUtils.setField(meetingService, "speakerService", speakerService);
        // Inject motionService mock vào MeetingService (dùng setter injection)
        ReflectionTestUtils.setField(meetingService, "motionService", motionService);
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

        lenient().when(currentUserService.canCreateMeeting()).thenReturn(true);

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

        when(currentUserService.canCreateMeeting()).thenReturn(true);
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
        when(currentUserService.canCreateMeeting()).thenReturn(true);
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
    void submitForApproval_WhenTimeInPast_ShouldThrowException() {
        // Arrange
        meeting.setStartTime(LocalDateTime.now().minusMinutes(10)); // in past
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.submitForApproval(meetingId);
        });
        assertEquals(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES, ex.getErrorCode());
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
    void submitForApproval_Successful_ShouldDelegateToApprovalService() {
        // Arrange
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(2L);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.SECRETARY)).thenReturn(1L);
        when(approvalService.submitResource(ResourceType.MEETING, meetingId, null, null, null))
                .thenReturn(ApprovalRequestResponse.builder().build());

        // Act
        meetingService.submitForApproval(meetingId);

        // Assert
        verify(approvalService, times(1)).submitResource(ResourceType.MEETING, meetingId, null, null, null);
    }

    @Test
    void submitForApproval_WhenAgendaHasNoPreparer_ShouldNotThrowException() {
        // Arrange
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(UUID.randomUUID());
        agendaItem.setStatus(AgendaItemStatus.DRAFT);
        agendaItem.setPreparedByUser(null); // No preparer
        meeting.setAgendaItemList(List.of(agendaItem));

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(1L);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.SECRETARY)).thenReturn(1L);
        when(approvalService.submitResource(ResourceType.MEETING, meetingId, null, null, null))
                .thenReturn(ApprovalRequestResponse.builder().build());

        // Act & Assert (Should not throw exception despite agendaItem status being DRAFT)
        assertDoesNotThrow(() -> meetingService.submitForApproval(meetingId));
        verify(approvalService, times(1)).submitResource(ResourceType.MEETING, meetingId, null, null, null);
    }

    @Test
    void approve_Successful_ShouldDelegateToApprovalService() {
        // Arrange
        meeting.setStatus(MeetingStatus.PENDING_APPROVAL);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)).thenReturn(true);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentService.getAllSubDepartmentIds(departmentId)).thenReturn(List.of(departmentId));
        when(approvalService.approveResource(ResourceType.MEETING, meetingId, null))
                .thenReturn(ApprovalRequestResponse.builder().build());

        // Act
        meetingService.approve(meetingId);

        // Assert
        verify(approvalService, times(1)).approveResource(ResourceType.MEETING, meetingId, null);
    }

    @Test
    void reject_WhenReasonEmpty_ShouldThrowException() {
        // Arrange
        when(approvalService.rejectResource(ResourceType.MEETING, meetingId, ""))
                .thenThrow(new AppException(ErrorCode.BAD_REQUEST));

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

    // =====================================================================
    // BỔ SUNG: create — trường hợp thiếu quyền, thiếu department/location
    // =====================================================================

    @Test
    void create_WhenNoAuthority_ShouldThrowUnauthorized() {
        // Arrange
        when(currentUserService.canCreateMeeting()).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.create(request);
        });
        assertEquals(ErrorCode.UNAUTHOZIZED, ex.getErrorCode());
    }

    @Test
    void create_WhenDepartmentNotExist_ShouldThrowException() {
        // Arrange
        when(currentUserService.canCreateMeeting()).thenReturn(true);
        when(meetingRepository.existsRoomConflict(any(), any(), any(), any(), any())).thenReturn(false);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.empty());

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.create(request);
        });
        assertEquals(ErrorCode.DEPARTMENT_NOT_EXIST, ex.getErrorCode());
    }

    @Test
    void create_WhenLocationNotExist_ShouldThrowException() {
        // Arrange
        when(currentUserService.canCreateMeeting()).thenReturn(true);
        when(meetingRepository.existsRoomConflict(any(), any(), any(), any(), any())).thenReturn(false);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentRepository.findById(departmentId)).thenReturn(Optional.of(department));
        when(locationRepository.findById(locationId)).thenReturn(Optional.empty());

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.create(request);
        });
        assertEquals(ErrorCode.LOCATION_NOT_EXIST, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: update — validate status, luồng thành công
    // =====================================================================

    @Test
    void update_WhenStatusNotDraftOrRejected_ShouldThrowException() {
        // Arrange — Meeting đang ở APPROVED → không được sửa
        meeting.setStatus(MeetingStatus.APPROVED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.update(meetingId, request);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void update_WhenStatusPendingApproval_ShouldThrowException() {
        // Arrange — Meeting đang chờ duyệt → không được sửa
        meeting.setStatus(MeetingStatus.PENDING_APPROVAL);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.update(meetingId, request);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: submitForApproval — validate trạng thái nhảy cóc
    // =====================================================================

    @Test
    void submitForApproval_WhenStatusApproved_ShouldThrowException() {
        // Arrange — Nhảy cóc: APPROVED → submitForApproval (phải chỉ DRAFT/REJECTED)
        meeting.setStatus(MeetingStatus.APPROVED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.submitForApproval(meetingId);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void submitForApproval_WhenStatusUpcoming_ShouldThrowException() {
        // Arrange — Nhảy cóc: UPCOMING → submitForApproval
        meeting.setStatus(MeetingStatus.UPCOMING);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.submitForApproval(meetingId);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: approve — validate trạng thái, quyền
    // =====================================================================

    @Test
    void approve_WhenStatusDraft_ShouldThrowException() {
        when(approvalService.approveResource(ResourceType.MEETING, meetingId, null))
                .thenThrow(new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID));

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.approve(meetingId);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void approve_WhenNotDepartmentAdmin_ShouldThrowUnauthorized() {
        when(approvalService.approveResource(ResourceType.MEETING, meetingId, null))
                .thenThrow(new AppException(ErrorCode.UNAUTHOZIZED));

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.approve(meetingId);
        });
        assertEquals(ErrorCode.UNAUTHOZIZED, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: reject — validate trạng thái, luồng thành công
    // =====================================================================

    @Test
    void reject_WhenStatusNotPendingApproval_ShouldThrowException() {
        when(approvalService.rejectResource(ResourceType.MEETING, meetingId, "Reason"))
                .thenThrow(new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID));

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.reject(meetingId, "Reason");
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void reject_Successful_ShouldDelegateToApprovalService() {
        // Arrange
        meeting.setStatus(MeetingStatus.PENDING_APPROVAL);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)).thenReturn(true);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(departmentService.getAllSubDepartmentIds(any())).thenReturn(List.of(departmentId));
        when(approvalService.rejectResource(ResourceType.MEETING, meetingId, "Tài liệu chưa đầy đủ"))
                .thenReturn(ApprovalRequestResponse.builder().build());

        // Act
        meetingService.reject(meetingId, "Tài liệu chưa đầy đủ");

        // Assert
        verify(approvalService, times(1)).rejectResource(ResourceType.MEETING, meetingId, "Tài liệu chưa đầy đủ");
    }

    // =====================================================================
    // BỔ SUNG: publish — validate trạng thái
    // =====================================================================

    @Test
    void publish_WhenStatusNotApproved_ShouldThrowException() {
        // Arrange — Nhảy cóc: DRAFT → publish (phải APPROVED trước)
        meeting.setStatus(MeetingStatus.DRAFT);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.publish(meetingId);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void publish_WhenTimeInPast_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.APPROVED);
        meeting.setStartTime(LocalDateTime.now().minusMinutes(10)); // in past
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.publish(meetingId);
        });
        assertEquals(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES, ex.getErrorCode());
    }

    @Test
    void publish_Successful_ShouldTransitionToUpcoming() {
        // Arrange
        meeting.setStatus(MeetingStatus.APPROVED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act
        meetingService.publish(meetingId);

        // Assert
        assertEquals(MeetingStatus.UPCOMING, meeting.getStatus());
        verify(meetingRepository, times(1)).save(meeting);
    }

    // =====================================================================
    // BỔ SUNG: cancel — validate lý do rỗng, validate trạng thái, luồng thành công
    // =====================================================================

    @Test
    void cancel_WhenReasonEmpty_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.UPCOMING);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.cancel(meetingId, "");
        });
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }

    @Test
    void cancel_WhenReasonNull_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.UPCOMING);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.cancel(meetingId, null);
        });
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }

    @Test
    void cancel_WhenStatusDraft_ShouldThrowException() {
        // Arrange — DRAFT không cancel được (chỉ UPCOMING/PENDING_APPROVAL/APPROVED)
        meeting.setStatus(MeetingStatus.DRAFT);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.cancel(meetingId, "Reason");
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void cancel_Successful_ShouldTransitionToCancelled() {
        // Arrange
        meeting.setStatus(MeetingStatus.UPCOMING);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act
        meetingService.cancel(meetingId, "Cuộc họp không cần thiết");

        // Assert
        assertEquals(MeetingStatus.CANCELLED, meeting.getStatus());
        assertEquals("Cuộc họp không cần thiết", meeting.getCancelReason());
        verify(meetingRepository, times(1)).save(meeting);
    }

    // =====================================================================
    // BỔ SUNG: close — validate trạng thái, luồng thành công
    // =====================================================================

    @Test
    void close_WhenStatusNotInProgress_ShouldThrowException() {
        // Arrange — Nhảy cóc: DRAFT → close
        meeting.setStatus(MeetingStatus.DRAFT);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.close(meetingId);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void close_Successful_ShouldTransitionToClosed() {
        // Arrange
        meeting.setStatus(MeetingStatus.IN_PROGRESS);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);
        doNothing().when(speakerService).closeAllQueuesAndTurns(meetingId);
        doNothing().when(motionService).closeAllOpenVoteSessions(meetingId);

        // Act
        meetingService.close(meetingId);

        // Assert
        assertEquals(MeetingStatus.CLOSED, meeting.getStatus());
        verify(meetingRepository, times(1)).save(meeting);
        verify(speakerService, times(1)).closeAllQueuesAndTurns(meetingId);
        verify(motionService, times(1)).closeAllOpenVoteSessions(meetingId);
    }

    // =====================================================================
    // BỔ SUNG: rsvpDeadline, delete, restore
    // =====================================================================

    @Test
    void create_WhenRsvpDeadlineAfterStartTime_ShouldThrowException() {
        // Arrange
        request.setStartTime(LocalDateTime.now().plusMinutes(60));
        request.setRsvpDeadline(LocalDateTime.now().plusMinutes(70));

        when(currentUserService.canCreateMeeting()).thenReturn(true);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.create(request);
        });
        assertEquals(ErrorCode.MEETING_INVALID_RSVP_DEADLINE, ex.getErrorCode());
    }

    @Test
    void delete_WhenStatusNotDraft_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.UPCOMING);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.delete(meetingId);
        });
        assertEquals(ErrorCode.MEETING_ONLY_DRAFT_ALLOWED, ex.getErrorCode());
    }

    @Test
    void delete_Successful() {
        // Arrange
        meeting.setStatus(MeetingStatus.DRAFT);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act
        meetingService.delete(meetingId);

        // Assert
        verify(meetingRepository, times(1)).delete(meeting);
    }

    @Test
    void restore_WhenNotDeleted_ShouldThrowException() {
        // Arrange
        meeting.setIsDeleted(false); // not deleted yet
        when(meetingRepository.findByIdIncludingDeleted(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingService.restore(meetingId);
        });
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }

    @Test
    void restore_Successful() {
        // Arrange
        meeting.setIsDeleted(true);
        when(meetingRepository.findByIdIncludingDeleted(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);

        // Act
        meetingService.restore(meetingId);

        // Assert
        verify(meetingRepository, times(1)).restoreMeetingNative(meetingId);
    }
}
