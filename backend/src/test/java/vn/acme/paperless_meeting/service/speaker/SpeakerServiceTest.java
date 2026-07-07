package vn.acme.paperless_meeting.service.speaker;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

import vn.acme.paperless_meeting.dto.request.speaker.ReorderQueueRequest;
import vn.acme.paperless_meeting.dto.request.speaker.StartDirectTurnRequest;
import vn.acme.paperless_meeting.dto.request.speaker.StartTurnRequest;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerQueueResponse;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerTurnResponse;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.SpeakerQueue;
import vn.acme.paperless_meeting.entity.SpeakerTurn;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueuePriority;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueueStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.SpeakerQueueRepository;
import vn.acme.paperless_meeting.repository.SpeakerTurnRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SpeakerServiceTest {

    @Mock
    SpeakerQueueRepository speakerQueueRepository;
    @Mock
    SpeakerTurnRepository speakerTurnRepository;
    @Mock
    MeetingRepository meetingRepository;
    @Mock
    MeetingParticipantRepository meetingParticipantRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    AgendaItemRepository agendaItemRepository;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    AuditLogPublisher auditLogPublisher;
    @Mock
    vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService webSocketNotificationService;

    @InjectMocks
    SpeakerService speakerService;

    private UUID meetingId;
    private UUID userId;
    private User caller;
    private Meeting meeting;

    @BeforeEach
    void setUp() {
        meetingId = UUID.randomUUID();
        userId = UUID.randomUUID();

        caller = new User();
        caller.setId(userId);
        caller.setFullName("User Name");

        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setStatus(MeetingStatus.IN_PROGRESS);

        MeetingParticipant participant = new MeetingParticipant();
        participant.setId(UUID.randomUUID());
        participant.setMeeting(meeting);
        participant.setUser(caller);
        participant.setParticipantRole(ParticipantRole.PARTICIPANT);
        participant.setInviteStatus(InviteStatus.ACCEPTED);
        participant.setAttendanceStatus(AttendanceStatus.PRESENT);

        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, userId)).thenReturn(true);
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)).thenReturn(Optional.of(participant));
    }

    @Test
    void requestToSpeak_WhenMeetingNotInProgress_ShouldThrowException() {
        meeting.setStatus(MeetingStatus.UPCOMING);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));

        AppException ex = assertThrows(AppException.class, () -> {
            speakerService.requestToSpeak(meetingId, null);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void requestToSpeak_WhenUserNotParticipant_ShouldThrowUnauthorized() {
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> {
            speakerService.requestToSpeak(meetingId, null);
        });
        assertEquals(ErrorCode.UNAUTHOZIZED, ex.getErrorCode());
    }

    @Test
    void requestToSpeak_WhenParticipantNotPresent_ShouldThrowException() {
        MeetingParticipant participant = meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)
                .orElseThrow();
        participant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);

        AppException ex = assertThrows(AppException.class, () -> {
            speakerService.requestToSpeak(meetingId, null);
        });
        assertEquals(ErrorCode.PARTICIPANT_NOT_PRESENT, ex.getErrorCode());
    }

    @Test
    void requestToSpeak_WhenAlreadyInQueue_ShouldThrowBadRequest() {
        when(speakerQueueRepository.existsByMeetingIdAndUserIdAndQueueStatus(meetingId, userId, SpeakerQueueStatus.QUEUED)).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> {
            speakerService.requestToSpeak(meetingId, null);
        });
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }

    @Test
    void requestToSpeak_Success_ShouldReturnQueueResponse() {
        when(speakerQueueRepository.existsByMeetingIdAndUserIdAndQueueStatus(meetingId, userId, SpeakerQueueStatus.QUEUED)).thenReturn(false);
        when(speakerQueueRepository.findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.QUEUED))
            .thenReturn(new ArrayList<>());
            
        when(speakerQueueRepository.save(any())).thenAnswer(i -> {
            SpeakerQueue q = i.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        SpeakerQueueResponse response = speakerService.requestToSpeak(meetingId, null);
        
        assertNotNull(response);
        assertEquals(SpeakerQueueStatus.QUEUED, response.getQueueStatus());
        assertEquals(1, response.getSortOrder());
    }

    @Test
    void rejectOrCancelRequest_ByOwner_ShouldCancel() {
        UUID queueId = UUID.randomUUID();
        SpeakerQueue queue = new SpeakerQueue();
        queue.setId(queueId);
        queue.setUser(caller);
        
        when(speakerQueueRepository.findById(queueId)).thenReturn(Optional.of(queue));

        speakerService.rejectOrCancelRequest(meetingId, queueId);

        assertEquals(SpeakerQueueStatus.CANCELLED, queue.getQueueStatus());
        verify(speakerQueueRepository, times(1)).save(queue);
    }

    @Test
    void rejectOrCancelRequest_ByChair_ShouldReject() {
        UUID queueId = UUID.randomUUID();
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        
        SpeakerQueue queue = new SpeakerQueue();
        queue.setId(queueId);
        queue.setUser(otherUser);
        
        when(speakerQueueRepository.findById(queueId)).thenReturn(Optional.of(queue));
        when(meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(meetingId, userId, ParticipantRole.CHAIR)).thenReturn(true);

        speakerService.rejectOrCancelRequest(meetingId, queueId);

        assertEquals(SpeakerQueueStatus.REJECTED, queue.getQueueStatus());
        verify(speakerQueueRepository, times(1)).save(queue);
    }
    
    @Test
    void rejectOrCancelRequest_ByNonChairOther_ShouldThrowUnauthorized() {
        UUID queueId = UUID.randomUUID();
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        
        SpeakerQueue queue = new SpeakerQueue();
        queue.setId(queueId);
        queue.setUser(otherUser);
        
        when(speakerQueueRepository.findById(queueId)).thenReturn(Optional.of(queue));
        when(meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(meetingId, userId, ParticipantRole.CHAIR)).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> {
            speakerService.rejectOrCancelRequest(meetingId, queueId);
        });
        assertEquals(ErrorCode.UNAUTHOZIZED, ex.getErrorCode());
    }

    @Test
    void startTurn_Success() {
        UUID queueId = UUID.randomUUID();
        
        SpeakerQueue queue = new SpeakerQueue();
        queue.setId(queueId);
        queue.setUser(caller);
        queue.setMeeting(meeting);
        queue.setQueueStatus(SpeakerQueueStatus.QUEUED);

        when(speakerQueueRepository.findById(queueId)).thenReturn(Optional.of(queue));
        when(meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(meetingId, userId, ParticipantRole.CHAIR)).thenReturn(true);
        when(speakerTurnRepository.save(any())).thenAnswer(i -> {
            SpeakerTurn t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        StartTurnRequest req = new StartTurnRequest(5);
        
        SpeakerTurnResponse response = speakerService.startTurn(meetingId, queueId, req);

        assertNotNull(response);
        assertEquals(SpeakerQueueStatus.SPEAKING, queue.getQueueStatus());
        assertEquals(300L, response.getDurationSeconds());
    }
}
