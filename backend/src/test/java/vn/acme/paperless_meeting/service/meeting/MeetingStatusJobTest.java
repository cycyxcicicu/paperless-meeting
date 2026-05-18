package vn.acme.paperless_meeting.service.meeting;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.repository.MeetingRepository;

@ExtendWith(MockitoExtension.class)
class MeetingStatusJobTest {

    @Mock
    MeetingRepository meetingRepository;

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
}
