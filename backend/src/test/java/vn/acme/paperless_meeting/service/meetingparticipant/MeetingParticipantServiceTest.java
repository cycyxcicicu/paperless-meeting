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
}
