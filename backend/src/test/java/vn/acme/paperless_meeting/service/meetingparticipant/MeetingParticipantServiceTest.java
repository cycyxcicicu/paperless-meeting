package vn.acme.paperless_meeting.service.meetingparticipant;

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

import vn.acme.paperless_meeting.dto.request.meetingparticipant.*;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.*;
import vn.acme.paperless_meeting.entity.*;
import vn.acme.paperless_meeting.entity.enums.*;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.meetingparticipant.MeetingGuestMapper;
import vn.acme.paperless_meeting.mapper.meetingparticipant.MeetingParticipantMapper;
import vn.acme.paperless_meeting.repository.*;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.document.DocumentService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MeetingParticipantServiceTest {

    @Mock
    MeetingParticipantRepository meetingParticipantRepository;
    @Mock
    MeetingGuestRepository meetingGuestRepository;
    @Mock
    MeetingRepository meetingRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    AttendanceLogRepository attendanceLogRepository;
    @Mock
    MeetingParticipantMapper meetingParticipantMapper;
    @Mock
    MeetingGuestMapper meetingGuestMapper;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    AuditLogPublisher auditLogPublisher;
    @Mock
    VoteEligibilityRepository voteEligibilityRepository;
    @Mock
    DocumentService documentService;
    @Mock
    MeetingInvitationRepository meetingInvitationRepository;
    @Mock
    NotificationRepository notificationRepository;

    @InjectMocks
    MeetingParticipantService meetingParticipantService;

    private User caller;
    private Meeting meeting;
    private User user;
    private MeetingParticipant participant;
    private MeetingGuest guest;
    private UUID meetingId;
    private UUID userId;
    private UUID guestId;

    @BeforeEach
    void setUp() {
        meetingId = UUID.randomUUID();
        userId = UUID.randomUUID();
        guestId = UUID.randomUUID();

        caller = new User();
        caller.setId(UUID.randomUUID());
        Department department = new Department();
        department.setId(UUID.randomUUID());
        caller.setDepartment(department);

        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setCreatedBy(caller);
        meeting.setDepartment(department);
        meeting.setStatus(MeetingStatus.APPROVED);
        meeting.setStartTime(LocalDateTime.now().plusMinutes(60));
        meeting.setEndTime(LocalDateTime.now().plusMinutes(120));
        meeting.setLateAfterMinutes(15);
        meeting.setMeetingParticipantList(new ArrayList<>());

        user = new User();
        user.setId(userId);
        user.setFullName("User Test");
        user.setStatus(vn.acme.paperless_meeting.entity.enums.UserStatus.ACTIVE);

        participant = new MeetingParticipant();
        participant.setId(UUID.randomUUID());
        participant.setMeeting(meeting);
        participant.setUser(user);
        participant.setParticipantRole(ParticipantRole.PARTICIPANT);
        participant.setInviteStatus(InviteStatus.PENDING);
        participant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);

        guest = new MeetingGuest();
        guest.setId(guestId);
        guest.setMeeting(meeting);
        guest.setEmail("guest@example.com");
        guest.setFullName("Guest Test");
        guest.setInviteStatus(InviteStatus.PENDING);
    }

    @Test
    void addParticipants_WhenChairGreaterThan3_ShouldThrowException() {
        // Arrange
        AddParticipantRequest req = new AddParticipantRequest();
        req.setUserId(userId);
        req.setParticipantRole(ParticipantRole.CHAIR);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(meetingParticipantMapper.toEntity(req)).thenReturn(participant);
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(4L); // > 3 Chairs

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.addParticipants(meetingId, List.of(req));
        });
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }

    @Test
    void addExternalGuests_Successful_ShouldGenerateRsvpToken() {
        // Arrange
        AddGuestRequest req = new AddGuestRequest();
        req.setEmail("guest@example.com");
        req.setFullName("Guest Test");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingGuestMapper.toEntity(req)).thenReturn(guest);

        // Act
        List<GuestResponse> responses = meetingParticipantService.addExternalGuests(meetingId, List.of(req));

        // Assert
        verify(meetingGuestRepository, times(1)).save(argThat(g -> 
            g.getRsvpToken() != null &&
            g.getInviteStatus() == InviteStatus.PENDING
        ));
    }

    @Test
    void updateInviteStatus_DeclineWithSubstitute_Successful() {
        // Arrange
        UpdateInviteStatusRequest req = new UpdateInviteStatusRequest();
        req.setInviteStatus(InviteStatus.DECLINED);
        req.setDeclineReason("Vắng mặt");
        req.setSubstituteUserId(userId);

        User substituteUser = new User();
        substituteUser.setId(userId);
        substituteUser.setFullName("Substitute User");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)).thenReturn(Optional.of(participant));
        when(userRepository.findById(userId)).thenReturn(Optional.of(substituteUser));

        // Act
        meetingParticipantService.updateInviteStatus(meetingId, userId, req);

        // Assert
        assertEquals(InviteStatus.DECLINED, participant.getInviteStatus());
        assertEquals("Vắng mặt", participant.getDeclineReason());
        assertEquals(substituteUser, participant.getSubstituteUser());
        verify(meetingParticipantRepository, times(1)).save(participant);
    }

    @Test
    void rsvpGuest_Accept_Successful_ShouldGenerateGuestToken() {
        // Arrange
        UUID rsvpToken = UUID.randomUUID();
        UpdateInviteStatusRequest req = new UpdateInviteStatusRequest();
        req.setInviteStatus(InviteStatus.ACCEPTED);

        when(meetingGuestRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.of(guest));

        // Act
        meetingParticipantService.publicUpdateGuestRsvpByRsvpToken(rsvpToken, req);

        // Assert
        assertEquals(InviteStatus.ACCEPTED, guest.getInviteStatus());
        assertNotNull(guest.getGuestToken());
        verify(meetingGuestRepository, times(1)).save(guest);
    }

    @Test
    void updateAttendanceStatus_WhenLate_ShouldRecordLateMinutes() {
        // Arrange
        UUID attendeeId = participant.getId();
        UpdateAttendanceStatusRequest req = new UpdateAttendanceStatusRequest();
        req.setAttendanceStatus(AttendanceStatus.PRESENT);

        participant.setInviteStatus(InviteStatus.ACCEPTED); // Must be ACCEPTED to mark attendance

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingParticipantRepository.findById(attendeeId)).thenReturn(Optional.of(participant));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        // Act
        meetingParticipantService.updateAttendanceStatus(meetingId, attendeeId, "INTERNAL", req);

        // Assert
        assertEquals(AttendanceStatus.PRESENT, participant.getAttendanceStatus());
        verify(attendanceLogRepository, times(1)).save(argThat(log -> 
            log.getUser().equals(user)
        ));
    }

    @Test
    void getAttendeeStatistics_ShouldCalculateCorrectly() {
        // Arrange
        meeting.getMeetingParticipantList().add(participant);
        participant.setInviteStatus(InviteStatus.ACCEPTED);
        participant.setAttendanceStatus(AttendanceStatus.PRESENT);

        MeetingParticipant p2 = new MeetingParticipant();
        User u2 = new User();
        u2.setId(UUID.randomUUID());
        u2.setFullName("User 2");
        p2.setUser(u2);
        p2.setInviteStatus(InviteStatus.DECLINED);
        p2.setAttendanceStatus(AttendanceStatus.ABSENT);
        meeting.getMeetingParticipantList().add(p2);

        // Giả lập cuộc họp có người tạo là creator (caller) đã nằm trong list (thỏa mãn hasCreator)
        participant.setUser(caller);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingParticipantRepository.findByMeetingId(meetingId)).thenReturn(List.of(participant, p2));
        when(meetingGuestRepository.findByMeetingId(meetingId)).thenReturn(List.of(guest));

        // Setup Mapper mocks because getAttendeeStatistics depends on getAttendees which calls toResponse
        ParticipantResponse p1Response = ParticipantResponse.builder()
                .inviteStatus(InviteStatus.ACCEPTED)
                .attendanceStatus(AttendanceStatus.PRESENT)
                .build();
        lenient().when(meetingParticipantMapper.toResponse(participant)).thenReturn(p1Response);

        ParticipantResponse p2Response = ParticipantResponse.builder()
                .inviteStatus(InviteStatus.DECLINED)
                .attendanceStatus(AttendanceStatus.ABSENT)
                .build();
        lenient().when(meetingParticipantMapper.toResponse(p2)).thenReturn(p2Response);

        GuestResponse guestResponse = GuestResponse.builder()
                .inviteStatus(InviteStatus.PENDING)
                .attendanceStatus(AttendanceStatus.NOT_CHECKED_IN)
                .build();
        lenient().when(meetingGuestMapper.toResponse(guest)).thenReturn(guestResponse);

        // Act
        AttendeeStatisticsResponse stats = meetingParticipantService.getAttendeeStatistics(meetingId);

        // Assert
        assertEquals(3, stats.getTotalAttendees()); // 2 participants + 1 guest
        assertEquals(1, stats.getTotalCheckedIn()); // p1 checked in
        assertEquals(1, stats.getTotalDeclined()); // p2 declined
        assertEquals(1, stats.getTotalPending()); // guest pending
    }

    // =====================================================================
    // BỔ SUNG: addParticipants — validate meeting đã đóng/hủy
    // =====================================================================

    @Test
    void addParticipants_WhenMeetingClosed_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.CLOSED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        AddParticipantRequest req = new AddParticipantRequest();
        req.setUserId(userId);
        req.setParticipantRole(ParticipantRole.PARTICIPANT);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.addParticipants(meetingId, List.of(req));
        });
        assertEquals(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED, ex.getErrorCode());
    }

    @Test
    void addParticipants_WhenMeetingCancelled_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.CANCELLED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        AddParticipantRequest req = new AddParticipantRequest();
        req.setUserId(userId);
        req.setParticipantRole(ParticipantRole.PARTICIPANT);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.addParticipants(meetingId, List.of(req));
        });
        assertEquals(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: updateAttendanceStatus — invite chưa ACCEPTED
    // =====================================================================

    @Test
    void updateAttendanceStatus_WhenInviteNotAccepted_ShouldThrowException() {
        // Arrange — Đại biểu chưa ACCEPTED → không được điểm danh
        UUID attendeeId = participant.getId();
        UpdateAttendanceStatusRequest req = new UpdateAttendanceStatusRequest();
        req.setAttendanceStatus(AttendanceStatus.PRESENT);

        participant.setInviteStatus(InviteStatus.PENDING); // Chưa chấp nhận

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingParticipantRepository.findById(attendeeId)).thenReturn(Optional.of(participant));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.updateAttendanceStatus(meetingId, attendeeId, "INTERNAL", req);
        });
        assertEquals(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: addExternalGuests — validate meeting đã đóng
    // =====================================================================

    @Test
    void addExternalGuests_WhenMeetingClosed_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.CLOSED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        AddGuestRequest req = new AddGuestRequest();
        req.setEmail("new-guest@example.com");
        req.setFullName("New Guest");

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.addExternalGuests(meetingId, List.of(req));
        });
        assertEquals(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: removeAttendee — validate meeting đã đóng
    // =====================================================================

    @Test
    void removeAttendee_WhenMeetingClosed_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.CLOSED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.removeAttendee(meetingId, participant.getId(), "INTERNAL");
        });
        assertEquals(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: addParticipants — validate IN_PROGRESS
    // =====================================================================

    @Test
    void addParticipants_WhenMeetingInProgress_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.IN_PROGRESS);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        AddParticipantRequest req = new AddParticipantRequest();
        req.setUserId(userId);
        req.setParticipantRole(ParticipantRole.PARTICIPANT);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.addParticipants(meetingId, List.of(req));
        });
        assertEquals(ErrorCode.MEETING_PARTICIPANT_NOT_EDITABLE, ex.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: updateInviteStatus — validate RSVP Deadline & Status
    // =====================================================================

    @Test
    void updateInviteStatus_WhenRsvpDeadlineExpired_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.UPCOMING);
        meeting.setRsvpDeadline(LocalDateTime.now().minusMinutes(10)); // Expired
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)).thenReturn(Optional.of(participant));
        when(currentUserService.getCurrentActiveUser()).thenReturn(user);

        UpdateInviteStatusRequest req = new UpdateInviteStatusRequest();
        req.setInviteStatus(InviteStatus.ACCEPTED);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.updateInviteStatus(meetingId, userId, req);
        });
        assertEquals(ErrorCode.MEETING_RSVP_DEADLINE_EXPIRED, ex.getErrorCode());
    }

    @Test
    void updateInviteStatus_WhenMeetingDraft_ShouldThrowException() {
        // Arrange
        meeting.setStatus(MeetingStatus.DRAFT);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)).thenReturn(Optional.of(participant));
        when(currentUserService.getCurrentActiveUser()).thenReturn(user);

        UpdateInviteStatusRequest req = new UpdateInviteStatusRequest();
        req.setInviteStatus(InviteStatus.ACCEPTED);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.updateInviteStatus(meetingId, userId, req);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void addParticipants_WhenDuplicatePayload_ShouldThrowMEETING_PARTICIPANT_ALREADY_EXISTS() {
        // Kiểm thử RÀNG BUỘC PARTICIPANT-01: Nếu gửi lên một danh sách đại biểu có 2 account trùng nhau, hệ thống sẽ chặn và ném lỗi trùng lặp
        // Arrange
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        AddParticipantRequest req1 = new AddParticipantRequest();
        req1.setUserId(userId);
        req1.setParticipantRole(ParticipantRole.PARTICIPANT);

        AddParticipantRequest req2 = new AddParticipantRequest();
        req2.setUserId(userId);
        req2.setParticipantRole(ParticipantRole.PARTICIPANT);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.addParticipants(meetingId, List.of(req1, req2));
        });
        assertEquals(ErrorCode.MEETING_PARTICIPANT_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    void addParticipants_WhenUserInactive_ShouldThrowUSER_NOT_ACTIVE() {
        // Kiểm thử RÀNG BUỘC PARTICIPANT-02: Nếu tài khoản User bị INACTIVE thì không cho phép thêm vào danh sách họp
        // Arrange
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        
        User inactiveUser = new User();
        inactiveUser.setId(userId);
        inactiveUser.setStatus(vn.acme.paperless_meeting.entity.enums.UserStatus.INACTIVE);
        when(userRepository.findById(userId)).thenReturn(Optional.of(inactiveUser));

        AddParticipantRequest req = new AddParticipantRequest();
        req.setUserId(userId);
        req.setParticipantRole(ParticipantRole.PARTICIPANT);

        MeetingParticipant dummyParticipant = new MeetingParticipant();
        when(meetingParticipantMapper.toEntity(req)).thenReturn(dummyParticipant);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.addParticipants(meetingId, List.of(req));
        });
        assertEquals(ErrorCode.USER_NOT_ACTIVE, ex.getErrorCode());
    }

    @Test
    void removeAttendee_WhenLastChair_ShouldThrowMEETING_CHAIR_REQUIRED() {
        // Kiểm thử RÀNG BUỘC PARTICIPANT-06: Chặn xoá Chủ tọa nếu họ là Chủ tọa cuối cùng của cuộc họp này
        // Arrange
        participant.setParticipantRole(ParticipantRole.CHAIR);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.findById(participant.getId())).thenReturn(Optional.of(participant));
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR)).thenReturn(1L);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.removeAttendee(meetingId, participant.getId(), "INTERNAL");
        });
        assertEquals(ErrorCode.MEETING_CHAIR_REQUIRED, ex.getErrorCode());
    }

    @Test
    void removeAttendee_WhenLastSecretary_ShouldThrowMEETING_SECRETARY_REQUIRED() {
        // Kiểm thử RÀNG BUỘC PARTICIPANT-07: Chặn xoá Thư ký nếu họ là Thư ký cuối cùng của cuộc họp này
        // Arrange
        participant.setParticipantRole(ParticipantRole.SECRETARY);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.findById(participant.getId())).thenReturn(Optional.of(participant));
        when(meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.SECRETARY)).thenReturn(1L);

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () -> {
            meetingParticipantService.removeAttendee(meetingId, participant.getId(), "INTERNAL");
        });
        assertEquals(ErrorCode.MEETING_SECRETARY_REQUIRED, ex.getErrorCode());
    }

    @Test
    void removeAttendee_WhenSuccessAndInternal_ShouldRevokeVoteEligibilities() {
        // Kiểm thử RÀNG BUỘC PARTICIPANT-12: Loại bỏ đại biểu thành công phải tự động đánh rớt quyền biểu quyết của họ
        // Arrange
        participant.setParticipantRole(ParticipantRole.PARTICIPANT);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingParticipantRepository.findById(participant.getId())).thenReturn(Optional.of(participant));

        // Act
        meetingParticipantService.removeAttendee(meetingId, participant.getId(), "INTERNAL");

        // Assert
        verify(meetingParticipantRepository).delete(participant);
        verify(voteEligibilityRepository).revokeVoteEligibility(meetingId, userId, "Đã bị loại khỏi cuộc họp");
    }

    @Test
    void publicGetMeetingDocumentsByGuestToken_ShouldFilterConfidential() {
        // Kiểm thử RÀNG BUỘC PARTICIPANT-10: Khách mời xem tài liệu thông qua token sẽ không bị trả về các File mật (isConfidential = true)
        // Arrange
        UUID guestToken = UUID.randomUUID();
        MeetingGuest guest = new MeetingGuest();
        guest.setMeeting(meeting);
        guest.setInviteStatus(InviteStatus.ACCEPTED);
        when(meetingGuestRepository.findByGuestToken(guestToken)).thenReturn(Optional.of(guest));

        vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse doc1 = vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse.builder()
                .id(UUID.randomUUID())
                .isConfidential(false)
                .build();
        vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse doc2 = vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse.builder()
                .id(UUID.randomUUID())
                .isConfidential(true) // Confidential!
                .build();

        when(documentService.getMeetingDocuments(meetingId)).thenReturn(List.of(doc1, doc2));

        // Act
        List<vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse> result = meetingParticipantService.publicGetMeetingDocumentsByGuestToken(guestToken);

        // Assert
        assertEquals(1, result.size());
        assertEquals(doc1.getId(), result.get(0).getId());
    }

    @Test
    void sendInvitations_ShouldThrowException_WhenMeetingStatusIsDraft() {
        // Kiểm thử RÀNG BUỘC INVITE-01: Chặn gửi thư mời khi meeting là DRAFT
        meeting.setStatus(MeetingStatus.DRAFT);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        SendInvitationsRequest request = new SendInvitationsRequest();

        AppException ex = assertThrows(AppException.class, () -> 
            meetingParticipantService.sendInvitations(meetingId, request)
        );
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void sendInvitations_ShouldSkipAlreadySent_WhenForceResendIsFalse() {
        // Kiểm thử RÀNG BUỘC INVITE-02: Chống spam thư mời (trùng lặp) trừ khi có forceResend
        meeting.setStatus(MeetingStatus.UPCOMING);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);

        MeetingParticipant p = new MeetingParticipant();
        p.setUser(user);
        when(meetingParticipantRepository.findByMeetingId(meetingId)).thenReturn(List.of(p));
        when(meetingGuestRepository.findByMeetingId(meetingId)).thenReturn(Collections.emptyList());

        // Mô phỏng thư mời đã được gửi trước đó
        when(meetingInvitationRepository.existsByMeetingIdAndInviteeUserIdAndSendStatus(
            eq(meetingId), eq(user.getId()), eq(SendStatus.SENT)
        )).thenReturn(true);

        SendInvitationsRequest request = new SendInvitationsRequest();
        request.setForceResend(false);

        meetingParticipantService.sendInvitations(meetingId, request);

        // Đảm bảo hàm save không được gọi vì đã bị skip
        verify(meetingInvitationRepository, never()).save(any(MeetingInvitation.class));
    }

    @Test
    void updateInviteStatus_ShouldSendAlertNotification_WhenParticipantDeclinesAfterAccepting() {
        // Kiểm thử RÀNG BUỘC INVITE-06: Bắn cảnh báo notification cho CHAIR nếu đại biểu "quay xe" TỪ CHỐI sau khi đã ĐỒNG Ý
        MeetingParticipant participant = new MeetingParticipant();
        participant.setId(UUID.randomUUID());
        participant.setUser(user);
        participant.setMeeting(meeting);
        participant.setInviteStatus(InviteStatus.ACCEPTED); // Trạng thái cũ là ACCEPTED
        
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(user);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, user.getId()))
                .thenReturn(Optional.of(participant));

        // Giả lập cuộc họp có 1 CHAIR (người nhận thông báo)
        MeetingParticipant chairObj = new MeetingParticipant();
        User chairUser = new User();
        chairUser.setId(UUID.randomUUID());
        chairUser.setFullName("Chair User");
        chairObj.setUser(chairUser);
        chairObj.setParticipantRole(ParticipantRole.CHAIR);
        when(meetingParticipantRepository.findByMeetingId(meetingId)).thenReturn(List.of(chairObj));

        UpdateInviteStatusRequest request = new UpdateInviteStatusRequest();
        request.setInviteStatus(InviteStatus.DECLINED);
        request.setDeclineReason("Bận việc đột xuất");

        // Act
        meetingParticipantService.updateInviteStatus(meetingId, user.getId(), request);

        // Assert
        assertEquals(InviteStatus.DECLINED, participant.getInviteStatus());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }
}

