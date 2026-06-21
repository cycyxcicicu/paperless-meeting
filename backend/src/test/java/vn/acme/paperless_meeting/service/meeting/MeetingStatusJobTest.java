package vn.acme.paperless_meeting.service.meeting;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.service.speaker.SpeakerService;
import vn.acme.paperless_meeting.service.motion.MotionService;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;

@ExtendWith(MockitoExtension.class)
class MeetingStatusJobTest {

    @Mock
    MeetingRepository meetingRepository;

    @Mock
    SpeakerService speakerService;

    @Mock
    MotionService motionService;

    @Mock
    WebSocketNotificationService webSocketNotificationService;

    @InjectMocks
    MeetingStatusJob meetingStatusJob;

    @Test
    void updateMeetingStatusToInProgress_WhenMeetingsFound_ShouldTransitionToInProgress() {
        // Arrange
        Meeting meeting = new Meeting();
        meeting.setStatus(MeetingStatus.UPCOMING);

        when(meetingRepository.findMeetingsToStart(eq(MeetingStatus.UPCOMING), any(LocalDateTime.class)))
                .thenReturn(List.of(meeting));

        // Act
        meetingStatusJob.updateMeetingStatusToInProgress();

        // Assert
        assertEquals(MeetingStatus.IN_PROGRESS, meeting.getStatus());
        verify(meetingRepository, times(1)).saveAll(anyList());
    }

    @Test
    void updateMeetingStatusToInProgress_WhenNoMeetingsFound_ShouldDoNothing() {
        // Arrange
        when(meetingRepository.findMeetingsToStart(eq(MeetingStatus.UPCOMING), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        // Act
        meetingStatusJob.updateMeetingStatusToInProgress();

        // Assert
        verify(meetingRepository, never()).saveAll(anyList());
    }

    @Test
    void autoCloseExpiredMeetings_WhenMeetingsFound_ShouldCloseThem() {
        // Arrange
        UUID meetingId = UUID.randomUUID();
        Meeting meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setTitle("Test Meeting");
        meeting.setStatus(MeetingStatus.IN_PROGRESS);

        when(meetingRepository.findMeetingsToClose(eq(MeetingStatus.IN_PROGRESS), any(LocalDateTime.class)))
                .thenReturn(List.of(meeting));

        // Act
        meetingStatusJob.autoCloseExpiredMeetings();

        // Assert
        assertEquals(MeetingStatus.CLOSED, meeting.getStatus());
        verify(meetingRepository, times(1)).save(meeting);
        verify(speakerService, times(1)).closeAllQueuesAndTurns(meetingId);
        verify(motionService, times(1)).closeAllOpenVoteSessions(meetingId);
        verify(webSocketNotificationService, times(2)).sendToTopic(anyString(), anyMap());
    }

    @Test
    void autoCloseExpiredMeetings_WhenNoMeetingsFound_ShouldDoNothing() {
        // Arrange
        when(meetingRepository.findMeetingsToClose(eq(MeetingStatus.IN_PROGRESS), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        // Act
        meetingStatusJob.autoCloseExpiredMeetings();

        // Assert
        verify(meetingRepository, never()).save(any(Meeting.class));
        verify(speakerService, never()).closeAllQueuesAndTurns(any(UUID.class));
        verify(motionService, never()).closeAllOpenVoteSessions(any(UUID.class));
    }
}
