package vn.acme.paperless_meeting.service.opinion;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

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

import vn.acme.paperless_meeting.dto.request.opinion.OpinionRequest;
import vn.acme.paperless_meeting.dto.response.opinion.OpinionResponse;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.DocumentVersion;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.Opinion;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingDocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.OpinionRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OpinionServiceTest {

    @Mock
    OpinionRepository opinionRepository;
    @Mock
    MeetingRepository meetingRepository;
    @Mock
    DocumentRepository documentRepository;
    @Mock
    MeetingDocumentRepository meetingDocumentRepository;
    @Mock
    MeetingParticipantRepository meetingParticipantRepository;
    @Mock
    CurrentUserService currentUserService;
    @Mock
    AuditLogPublisher auditLogPublisher;

    @InjectMocks
    OpinionService opinionService;

    private UUID meetingId;
    private UUID callerId;
    private UUID documentId;
    private Meeting meeting;
    private User caller;
    private MeetingParticipant participant;
    private Document document;

    @BeforeEach
    void setUp() {
        meetingId = UUID.randomUUID();
        callerId = UUID.randomUUID();
        documentId = UUID.randomUUID();

        // Keep fixtures explicit here so Maven recompiles this test cleanly when the service contract changes.
        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setStatus(MeetingStatus.IN_PROGRESS);

        caller = new User();
        caller.setId(callerId);
        caller.setFullName("Caller");

        participant = new MeetingParticipant();
        participant.setMeeting(meeting);
        participant.setUser(caller);
        participant.setAttendanceStatus(AttendanceStatus.PRESENT);

        DocumentVersion version = new DocumentVersion();
        version.setFileName("attachment.pdf");
        version.setFileUrl("http://localhost/attachment.pdf");

        document = new Document();
        document.setId(documentId);
        document.setTitle("Attachment");
        document.setCurrentVersion(version);

        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, callerId))
                .thenReturn(Optional.of(participant));
    }

    @Test
    void createOpinion_WhenMeetingNotInProgress_ShouldThrowException() {
        meeting.setStatus(MeetingStatus.UPCOMING);

        OpinionRequest request = new OpinionRequest();
        request.setOpinionDetail("Test opinion");

        AppException ex = assertThrows(AppException.class,
                () -> opinionService.createOpinion(meetingId, request));
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, ex.getErrorCode());
    }

    @Test
    void createOpinion_WhenParticipantNotPresent_ShouldThrowException() {
        participant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);

        OpinionRequest request = new OpinionRequest();
        request.setOpinionDetail("Test opinion");

        AppException ex = assertThrows(AppException.class,
                () -> opinionService.createOpinion(meetingId, request));
        assertEquals(ErrorCode.PARTICIPANT_NOT_PRESENT, ex.getErrorCode());
    }

    @Test
    void createOpinion_WhenAttachmentNotBelongToMeeting_ShouldThrowException() {
        OpinionRequest request = new OpinionRequest();
        request.setOpinionDetail("Test opinion");
        request.setDocumentIds(List.of(documentId));

        when(documentRepository.findAllById(request.getDocumentIds())).thenReturn(List.of(document));
        when(meetingDocumentRepository.existsByMeetingIdAndDocumentId(meetingId, documentId)).thenReturn(false);

        AppException ex = assertThrows(AppException.class,
                () -> opinionService.createOpinion(meetingId, request));
        assertEquals(ErrorCode.DOCUMENT_MEETING_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void createOpinion_Success() {
        OpinionRequest request = new OpinionRequest();
        request.setOpinionDetail("Test opinion");
        request.setDocumentName("Attachment");
        request.setDocumentIds(List.of(documentId));

        when(documentRepository.findAllById(request.getDocumentIds())).thenReturn(List.of(document));
        when(meetingDocumentRepository.existsByMeetingIdAndDocumentId(meetingId, documentId)).thenReturn(true);
        when(opinionRepository.save(any(Opinion.class))).thenAnswer(invocation -> {
            Opinion saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        OpinionResponse response = opinionService.createOpinion(meetingId, request);

        assertNotNull(response);
        assertEquals("Caller", response.getDelegateName());
        assertEquals("Test opinion", response.getContent());
        assertEquals(1, response.getAttachments().size());
    }

    @Test
    void publicCreateOpinion_WhenGuestNotPresent_ShouldThrowException() {
        MeetingGuest guest = new MeetingGuest();
        guest.setMeeting(meeting);
        guest.setFullName("Guest");
        guest.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);

        OpinionRequest request = new OpinionRequest();
        request.setOpinionDetail("Guest opinion");

        AppException ex = assertThrows(AppException.class,
                () -> opinionService.publicCreateOpinion(guest, request));
        assertEquals(ErrorCode.PARTICIPANT_NOT_PRESENT, ex.getErrorCode());
    }
}
