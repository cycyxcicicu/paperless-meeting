package vn.acme.paperless_meeting.service.motion;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.dto.response.motion.VoteStatisticsResponse;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.Motion;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.VoteSession;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.MotionStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.VoteSessionStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.motion.MotionMapper;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MotionRepository;
import vn.acme.paperless_meeting.repository.VoteBallotChoiceRepository;
import vn.acme.paperless_meeting.repository.VoteBallotRepository;
import vn.acme.paperless_meeting.repository.VoteOptionRepository;
import vn.acme.paperless_meeting.repository.VoteSessionRepository;
import vn.acme.paperless_meeting.repository.VoteEligibilityRepository;
import vn.acme.paperless_meeting.repository.VoteResultRepository;
import vn.acme.paperless_meeting.repository.VoteResultOptionRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class MotionServiceTest {

    @Mock
    MotionRepository motionRepository;
    @Mock
    MeetingParticipantRepository meetingParticipantRepository;
    @Mock
    VoteSessionRepository voteSessionRepository;
    @Mock
    VoteOptionRepository voteOptionRepository;
    @Mock
    VoteBallotRepository voteBallotRepository;
    @Mock
    VoteBallotChoiceRepository voteBallotChoiceRepository;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    MotionMapper motionMapper;
    @Mock
    VoteEligibilityRepository voteEligibilityRepository;
    @Mock
    VoteResultRepository voteResultRepository;
    @Mock
    VoteResultOptionRepository voteResultOptionRepository;
    @Mock
    AuditLogPublisher auditLogPublisher;
    @Mock
    vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService webSocketNotificationService;

    @InjectMocks
    MotionService motionService;

    private UUID motionId;
    private UUID meetingId;
    private UUID userId;
    private Motion motion;
    private Meeting meeting;
    private User user;
    private MeetingParticipant participant;

    @BeforeEach
    void setUp() {
        motionId = UUID.randomUUID();
        meetingId = UUID.randomUUID();
        userId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
        user.setFullName("Chủ tọa cuộc họp");

        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setStatus(MeetingStatus.IN_PROGRESS);

        motion = new Motion();
        motion.setId(motionId);
        motion.setMeeting(meeting);
        motion.setVoteSessionList(new ArrayList<>());

        participant = new MeetingParticipant();
        participant.setParticipantRole(ParticipantRole.CHAIR);
        participant.setAttendanceStatus(AttendanceStatus.PRESENT);

        when(motionRepository.findById(motionId)).thenReturn(Optional.of(motion));
        when(currentUserService.getCurrentActiveUser()).thenReturn(user);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId))
                .thenReturn(Optional.of(participant));
    }

    @Test
    void startVote_Success() {
        // Arrange
        when(voteSessionRepository.save(any(VoteSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(motionRepository.save(any(Motion.class))).thenReturn(motion);
        
        MotionResponse expectedResponse = MotionResponse.builder()
                .id(motionId)
                .status(MotionStatus.SUBMITTED)
                .build();
        when(motionMapper.toResponse(any(Motion.class))).thenReturn(expectedResponse);

        // Act
        MotionResponse response = motionService.startVote(motionId, 10);

        // Assert
        assertNotNull(response);
        assertEquals(MotionStatus.SUBMITTED, response.getStatus());
    }

    @Test
    void stopVote_Expired_Success() {
        // Arrange
        VoteSession expiredSession = new VoteSession();
        expiredSession.setId(UUID.randomUUID());
        expiredSession.setStatus(VoteSessionStatus.OPEN);
        expiredSession.setOpenedAt(LocalDateTime.now().minusMinutes(5));
        expiredSession.setDurationMinutes(2); // Expired (5 minutes ago > 2 minutes duration)
        expiredSession.setMotion(motion);
        motion.getVoteSessionList().add(expiredSession);

        when(voteSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(motionRepository.save(any())).thenReturn(motion);
        when(motionMapper.toResponse(any())).thenReturn(MotionResponse.builder().id(motionId).status(MotionStatus.CLOSED).build());
        when(voteEligibilityRepository.countByVoteSessionId(any())).thenReturn(0L);

        // Act
        MotionResponse response = motionService.stopVote(motionId);
        
        // Assert
        assertNotNull(response);
        assertEquals(MotionStatus.CLOSED, response.getStatus());
    }

    @Test
    void castVote_Expired_ThrowsException() {
        // Arrange
        VoteSession expiredSession = new VoteSession();
        expiredSession.setStatus(VoteSessionStatus.OPEN);
        expiredSession.setOpenedAt(LocalDateTime.now().minusMinutes(5));
        expiredSession.setDurationMinutes(2); // Expired
        expiredSession.setMotion(motion);
        motion.getVoteSessionList().add(expiredSession);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.castVote(motionId, UUID.randomUUID());
        });
        assertEquals(ErrorCode.VOTE_SESSION_CLOSED, exception.getErrorCode());
    }

    @Test
    void castVote_ParticipantNotPresent_ThrowsException() {
        // Arrange
        VoteSession session = new VoteSession();
        session.setStatus(VoteSessionStatus.OPEN);
        session.setOpenedAt(LocalDateTime.now());
        session.setDurationMinutes(5);
        session.setMotion(motion);
        motion.getVoteSessionList().add(session);

        participant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.castVote(motionId, UUID.randomUUID());
        });
        assertEquals(ErrorCode.PARTICIPANT_NOT_PRESENT, exception.getErrorCode());
    }

    @Test
    void getVoteStatistics_Success() {
        // Arrange
        VoteSession session = new VoteSession();
        session.setStatus(VoteSessionStatus.CLOSED);
        session.setVoteBallotList(new ArrayList<>());
        session.setVoteOptionList(new ArrayList<>());
        motion.getVoteSessionList().add(session);

        when(meetingParticipantRepository.findByMeetingId(meetingId)).thenReturn(new ArrayList<>());
        when(meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, userId)).thenReturn(true);

        // Act
        VoteStatisticsResponse response = motionService.getVoteStatistics(motionId);

        // Assert
        assertNotNull(response);
        assertEquals(0, response.getTotalVoters());
        assertEquals(0, response.getVotedCount());
    }

    // =====================================================================
    // BỔ SUNG: startVote — validate quyền và trạng thái cuộc họp
    // =====================================================================

    @Test
    void startVote_WhenNotChair_ShouldThrowUnauthorized() {
        // Arrange — Không phải chủ tọa
        participant.setParticipantRole(ParticipantRole.PARTICIPANT);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId))
                .thenReturn(Optional.of(participant));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.startVote(motionId, 10);
        });
        assertEquals(ErrorCode.UNAUTHOZIZED, exception.getErrorCode());
    }

    @Test
    void startVote_WhenMeetingNotInProgress_ShouldThrowException() {
        // Arrange — Meeting không ở trạng thái IN_PROGRESS
        meeting.setStatus(MeetingStatus.UPCOMING);
        // participant là CHAIR
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId))
                .thenReturn(Optional.of(participant));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.startVote(motionId, 10);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: stopVote — validate quyền
    // =====================================================================

    @Test
    void stopVote_WhenNotChair_ShouldThrowUnauthorized() {
        // Arrange — Người dùng là PARTICIPANT, không được dừng biểu quyết
        participant.setParticipantRole(ParticipantRole.PARTICIPANT);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId))
                .thenReturn(Optional.of(participant));

        VoteSession session = new VoteSession();
        session.setStatus(VoteSessionStatus.OPEN);
        session.setOpenedAt(LocalDateTime.now());
        session.setDurationMinutes(10);
        session.setMotion(motion);
        motion.getVoteSessionList().add(session);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.stopVote(motionId);
        });
        assertEquals(ErrorCode.UNAUTHOZIZED, exception.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: castVote — validate vai trò không được vote
    // =====================================================================

    @Test
    void castVote_WhenParticipantRoleIsSecretary_ShouldThrowException() {
        // Arrange — SECRETARY không được vote
        VoteSession session = new VoteSession();
        session.setStatus(VoteSessionStatus.OPEN);
        session.setOpenedAt(LocalDateTime.now());
        session.setDurationMinutes(10);
        session.setMotion(motion);
        motion.getVoteSessionList().add(session);

        participant.setAttendanceStatus(AttendanceStatus.PRESENT);
        participant.setParticipantRole(ParticipantRole.SECRETARY); // Thư ký không vote

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.castVote(motionId, UUID.randomUUID());
        });
        assertEquals(ErrorCode.VOTE_ROLE_NOT_ALLOWED, exception.getErrorCode());
    }

    @Test
    void castVote_WhenAlreadyVoted_ShouldThrowException() {
        // Arrange — Đã vote rồi
        VoteSession session = new VoteSession();
        session.setId(UUID.randomUUID());
        session.setStatus(VoteSessionStatus.OPEN);
        session.setOpenedAt(LocalDateTime.now());
        session.setDurationMinutes(10);
        session.setMotion(motion);
        motion.getVoteSessionList().add(session);

        participant.setAttendanceStatus(AttendanceStatus.PRESENT);
        participant.setParticipantRole(ParticipantRole.PARTICIPANT);

        when(voteBallotRepository.existsByVoteSessionIdAndUserId(session.getId(), userId)).thenReturn(true);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.castVote(motionId, UUID.randomUUID());
        });
        assertEquals(ErrorCode.VOTE_ALREADY_CAST, exception.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: createMotion — validate quyền theo trạng thái meeting
    // =====================================================================

    @Test
    void createMotion_WhenMeetingPendingApproval_ShouldThrowException() {
        // Arrange — Meeting ở PENDING_APPROVAL → không được tạo motion (startVote)
        // startVote kiểm tra meeting.status == IN_PROGRESS
        meeting.setStatus(MeetingStatus.PENDING_APPROVAL);

        // Vẫn để participant là CHAIR (qua được kiểm tra quyền)
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId))
                .thenReturn(Optional.of(participant));

        // Act & Assert — startVote khi meeting không IN_PROGRESS
        AppException exception = assertThrows(AppException.class, () -> {
            motionService.startVote(motionId, 5);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }

    @Test
    void startVote_AsSecretary_Success() {
        // Arrange
        participant.setParticipantRole(ParticipantRole.SECRETARY);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId))
                .thenReturn(Optional.of(participant));
        when(voteSessionRepository.save(any(VoteSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(motionRepository.save(any(Motion.class))).thenReturn(motion);
        
        MotionResponse expectedResponse = MotionResponse.builder()
                .id(motionId)
                .status(MotionStatus.SUBMITTED)
                .build();
        when(motionMapper.toResponse(any(Motion.class))).thenReturn(expectedResponse);

        // Act
        MotionResponse response = motionService.startVote(motionId, 10);

        // Assert
        assertNotNull(response);
        assertEquals(MotionStatus.SUBMITTED, response.getStatus());
    }

    @Test
    void stopVote_AsSecretary_Success() {
        // Arrange
        participant.setParticipantRole(ParticipantRole.SECRETARY);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId))
                .thenReturn(Optional.of(participant));

        VoteSession activeSession = new VoteSession();
        activeSession.setId(UUID.randomUUID());
        activeSession.setStatus(VoteSessionStatus.OPEN);
        activeSession.setOpenedAt(LocalDateTime.now());
        activeSession.setDurationMinutes(10);
        activeSession.setMotion(motion);
        motion.getVoteSessionList().add(activeSession);

        when(voteSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(motionRepository.save(any())).thenReturn(motion);
        when(motionMapper.toResponse(any())).thenReturn(MotionResponse.builder().id(motionId).status(MotionStatus.CLOSED).build());
        when(voteEligibilityRepository.countByVoteSessionId(any())).thenReturn(0L);

        // Act
        MotionResponse response = motionService.stopVote(motionId);
        
        // Assert
        assertNotNull(response);
        assertEquals(MotionStatus.CLOSED, response.getStatus());
    }
}
