package vn.acme.paperless_meeting.service.agenda;

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
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

import vn.acme.paperless_meeting.dto.request.agenda.AgendaItemUpsertRequest;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.agenda.AgendaItemMapper;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingDocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class AgendaItemServiceTest {

    @Mock
    AgendaItemRepository agendaItemRepository;

    @Mock
    MeetingRepository meetingRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    MeetingParticipantRepository meetingParticipantRepository;

    @Mock
    MeetingDocumentRepository meetingDocumentRepository;

    @Mock
    DocumentRepository documentRepository;

    @Mock
    CurrentUserService currentUserService;

    @Mock
    AgendaItemMapper agendaItemMapper;

    @InjectMocks
    AgendaItemService agendaItemService;

    private UUID meetingId;
    private UUID preparerId;
    private UUID creatorId;
    private Meeting meeting;
    private User preparer;
    private User creator;

    @BeforeEach
    void setUp() {
        meetingId = UUID.randomUUID();
        preparerId = UUID.randomUUID();
        creatorId = UUID.randomUUID();

        creator = new User();
        creator.setId(creatorId);
        creator.setFullName("Meeting Creator");

        preparer = new User();
        preparer.setId(preparerId);
        preparer.setFullName("Document Preparer");

        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setCreatedBy(creator);
        meeting.setStatus(vn.acme.paperless_meeting.entity.enums.MeetingStatus.DRAFT);
        meeting.setStartTime(LocalDateTime.of(2026, 6, 1, 9, 0));
        meeting.setEndTime(LocalDateTime.of(2026, 6, 1, 11, 0));

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(preparerId)).thenReturn(Optional.of(preparer));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);
    }

    @Test
    void createAgendaItem_Success() {
        // Arrange
        AgendaItemUpsertRequest request = new AgendaItemUpsertRequest();
        request.setTitle("Agenda Title");
        request.setOrderNo(1);
        request.setStartTime(LocalDateTime.of(2026, 6, 1, 9, 0));
        request.setEndTime(LocalDateTime.of(2026, 6, 1, 9, 30));
        request.setPreparedByUserId(preparerId);

        when(meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, preparerId)).thenReturn(true);
        
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(UUID.randomUUID());
        agendaItem.setMeeting(meeting);
        agendaItem.setPreparedByUser(preparer);
        agendaItem.setStatus(AgendaItemStatus.DRAFT);

        when(agendaItemMapper.toEntity(any(AgendaItemUpsertRequest.class))).thenReturn(agendaItem);
        when(agendaItemRepository.save(any(AgendaItem.class))).thenReturn(agendaItem);
        
        AgendaItemResponse responseDto = AgendaItemResponse.builder()
                .meetingId(meetingId)
                .preparedByUserId(preparerId)
                .status(AgendaItemStatus.DRAFT)
                .build();
        when(agendaItemMapper.toResponse(any(AgendaItem.class))).thenReturn(responseDto);

        // Act
        AgendaItemResponse response = agendaItemService.createAgendaItem(meetingId, request);

        // Assert
        assertNotNull(response);
        assertEquals(AgendaItemStatus.DRAFT, response.getStatus());
    }

    @Test
    void createAgendaItem_PreparerNotParticipant_ThrowsException() {
        // Arrange
        AgendaItemUpsertRequest request = new AgendaItemUpsertRequest();
        request.setTitle("Agenda Title");
        request.setPreparedByUserId(preparerId);

        // Preparer is NOT a participant in the meeting
        when(meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, preparerId)).thenReturn(false);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.createAgendaItem(meetingId, request);
        });
        assertEquals(ErrorCode.AGENDA_PREPARER_NOT_PARTICIPANT, exception.getErrorCode());
    }

    @Test
    void createAgendaItem_TimeOutOfMeeting_ThrowsException() {
        // Arrange
        AgendaItemUpsertRequest request = new AgendaItemUpsertRequest();
        request.setTitle("Agenda Title");
        request.setOrderNo(1);
        // Start time is before meeting start time
        request.setStartTime(LocalDateTime.of(2026, 6, 1, 8, 30));
        request.setEndTime(LocalDateTime.of(2026, 6, 1, 9, 30));

        // Act & Assert
        AppValidationException exception = assertThrows(AppValidationException.class, () -> {
            agendaItemService.createAgendaItem(meetingId, request);
        });
        org.junit.jupiter.api.Assertions.assertTrue(exception.getFieldErrors().containsKey("timeBound"));
    }

    @Test
    void createAgendaItem_TimeNotSequential_ThrowsException() {
        // Arrange
        AgendaItemUpsertRequest request = new AgendaItemUpsertRequest();
        request.setTitle("Agenda Item 2");
        request.setOrderNo(2);
        // Overlaps with existing item 1 (9:00 - 9:30)
        request.setStartTime(LocalDateTime.of(2026, 6, 1, 9, 20));
        request.setEndTime(LocalDateTime.of(2026, 6, 1, 10, 0));

        // Stub existing item 1
        AgendaItem existingItem = new AgendaItem();
        existingItem.setOrderNo(1);
        existingItem.setStartTime(LocalDateTime.of(2026, 6, 1, 9, 0));
        existingItem.setEndTime(LocalDateTime.of(2026, 6, 1, 9, 30));
        when(agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meetingId))
                .thenReturn(Collections.singletonList(existingItem));

        // Act & Assert
        AppValidationException exception = assertThrows(AppValidationException.class, () -> {
            agendaItemService.createAgendaItem(meetingId, request);
        });
        org.junit.jupiter.api.Assertions.assertTrue(exception.getFieldErrors().containsKey("sequence"));
    }

    @Test
    void submitDocs_Success() {
        // Arrange
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setPreparedByUser(preparer);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.PENDING_PREPARATION);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(preparer); // Preparer calls API
        when(agendaItemRepository.save(any(AgendaItem.class))).thenReturn(agendaItem);

        AgendaItemResponse responseDto = AgendaItemResponse.builder()
                .status(AgendaItemStatus.PENDING_APPROVAL)
                .build();
        when(agendaItemMapper.toResponse(any(AgendaItem.class))).thenReturn(responseDto);

        // Act
        AgendaItemResponse response = agendaItemService.submitDocs(agendaItemId, new ArrayList<>());

        // Assert
        assertNotNull(response);
        assertEquals(AgendaItemStatus.PENDING_APPROVAL, response.getStatus());
    }

    @Test
    void submitDocs_Forbidden_ThrowsException() {
        // Arrange
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setPreparedByUser(preparer);
        agendaItem.setStatus(AgendaItemStatus.PENDING_PREPARATION);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        
        // A random user (not the preparer) calls API
        User randomUser = new User();
        randomUser.setId(UUID.randomUUID());
        when(currentUserService.getCurrentActiveUser()).thenReturn(randomUser);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.submitDocs(agendaItemId, new ArrayList<>());
        });
        assertEquals(ErrorCode.AGENDA_SUBMIT_DOCS_FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void rejectDocs_Success() {
        // Arrange
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.PENDING_APPROVAL);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator); // Creator rejects
        when(agendaItemRepository.save(any(AgendaItem.class))).thenReturn(agendaItem);

        AgendaItemResponse responseDto = AgendaItemResponse.builder()
                .status(AgendaItemStatus.REJECTED)
                .rejectReason("Tài liệu chưa đầy đủ")
                .build();
        when(agendaItemMapper.toResponse(any(AgendaItem.class))).thenReturn(responseDto);

        // Act
        AgendaItemResponse response = agendaItemService.rejectDocs(agendaItemId, "Tài liệu chưa đầy đủ");

        // Assert
        assertNotNull(response);
        assertEquals(AgendaItemStatus.REJECTED, response.getStatus());
        assertEquals("Tài liệu chưa đầy đủ", response.getRejectReason());
    }

    // =====================================================================
    // BỔ SUNG: submitDocs — validate trạng thái nhảy cóc
    // =====================================================================

    @Test
    void submitDocs_WhenStatusDraft_ShouldThrowException() {
        // Arrange — Nhảy cóc: DRAFT → submitDocs (phải ở PENDING_PREPARATION/REJECTED)
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setPreparedByUser(preparer);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.DRAFT); // Sai trạng thái

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(preparer);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.submitDocs(agendaItemId, new ArrayList<>());
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }

    @Test
    void submitDocs_WhenStatusApproved_ShouldThrowException() {
        // Arrange — Trạng thái APPROVED → không submit lại được
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setPreparedByUser(preparer);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.APPROVED);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(preparer);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.submitDocs(agendaItemId, new ArrayList<>());
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: approveDocs — luồng thành công và validate
    // =====================================================================

    @Test
    void approveDocs_Success() {
        // Arrange
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.PENDING_APPROVAL);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);
        when(agendaItemRepository.save(any(AgendaItem.class))).thenReturn(agendaItem);

        AgendaItemResponse responseDto = AgendaItemResponse.builder()
                .status(AgendaItemStatus.APPROVED)
                .build();
        when(agendaItemMapper.toResponse(any(AgendaItem.class))).thenReturn(responseDto);

        // Act
        AgendaItemResponse response = agendaItemService.approveDocs(agendaItemId);

        // Assert
        assertNotNull(response);
        assertEquals(AgendaItemStatus.APPROVED, response.getStatus());
    }

    @Test
    void approveDocs_WhenNotCreator_ShouldThrowForbidden() {
        // Arrange — Không phải người tạo cuộc họp → không được phê duyệt
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.PENDING_APPROVAL);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));

        User randomUser = new User();
        randomUser.setId(UUID.randomUUID());
        when(currentUserService.getCurrentActiveUser()).thenReturn(randomUser);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.approveDocs(agendaItemId);
        });
        assertEquals(ErrorCode.AGENDA_APPROVE_FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void approveDocs_WhenStatusNotPendingApproval_ShouldThrowException() {
        // Arrange — Nhảy cóc: DRAFT → approveDocs (phải ở PENDING_APPROVAL)
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.DRAFT);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.approveDocs(agendaItemId);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: rejectDocs — validate quyền và trạng thái
    // =====================================================================

    @Test
    void rejectDocs_WhenNotCreator_ShouldThrowForbidden() {
        // Arrange
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.PENDING_APPROVAL);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));

        User randomUser = new User();
        randomUser.setId(UUID.randomUUID());
        when(currentUserService.getCurrentActiveUser()).thenReturn(randomUser);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.rejectDocs(agendaItemId, "Reason");
        });
        assertEquals(ErrorCode.AGENDA_APPROVE_FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void rejectDocs_WhenStatusNotPendingApproval_ShouldThrowException() {
        // Arrange — Nhảy cóc: DRAFT → rejectDocs
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.DRAFT);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.rejectDocs(agendaItemId, "Reason");
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: sendPrepRequest — validate trạng thái và thiếu preparer
    // =====================================================================

    @Test
    void sendPrepRequest_Success() {
        // Arrange
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.DRAFT);
        agendaItem.setPreparedByUser(preparer);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);
        when(agendaItemRepository.save(any(AgendaItem.class))).thenReturn(agendaItem);

        AgendaItemResponse responseDto = AgendaItemResponse.builder()
                .status(AgendaItemStatus.PENDING_PREPARATION)
                .build();
        when(agendaItemMapper.toResponse(any(AgendaItem.class))).thenReturn(responseDto);

        // Act
        AgendaItemResponse response = agendaItemService.sendPrepRequest(meetingId, agendaItemId);

        // Assert
        assertNotNull(response);
        assertEquals(AgendaItemStatus.PENDING_PREPARATION, response.getStatus());
    }

    @Test
    void sendPrepRequest_WhenStatusNotDraftOrRejected_ShouldThrowException() {
        // Arrange — Nhảy cóc: APPROVED → sendPrepRequest
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.APPROVED);

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.sendPrepRequest(meetingId, agendaItemId);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }

    @Test
    void sendPrepRequest_WhenNoPreparer_ShouldThrowException() {
        // Arrange — Chưa gán người chuẩn bị
        UUID agendaItemId = UUID.randomUUID();
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(meeting);
        agendaItem.setStatus(AgendaItemStatus.DRAFT);
        agendaItem.setPreparedByUser(null); // Không có preparer

        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.sendPrepRequest(meetingId, agendaItemId);
        });
        assertEquals(ErrorCode.USER_ID_REQUIRED, exception.getErrorCode());
    }

    // =====================================================================
    // BỔ SUNG: createAgendaItem — validate quyền và trạng thái meeting
    // =====================================================================

    @Test
    void createAgendaItem_WhenNotCreator_ShouldThrowForbidden() {
        // Arrange — Không phải người tạo cuộc họp
        User randomUser = new User();
        randomUser.setId(UUID.randomUUID());
        when(currentUserService.getCurrentActiveUser()).thenReturn(randomUser);

        AgendaItemUpsertRequest request = new AgendaItemUpsertRequest();
        request.setTitle("Agenda Title");

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.createAgendaItem(meetingId, request);
        });
        assertEquals(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void createAgendaItem_WhenMeetingApproved_ShouldThrowException() {
        // Arrange — Meeting đã duyệt → không được thêm agenda
        meeting.setStatus(vn.acme.paperless_meeting.entity.enums.MeetingStatus.APPROVED);
        when(currentUserService.getCurrentActiveUser()).thenReturn(creator);

        AgendaItemUpsertRequest request = new AgendaItemUpsertRequest();
        request.setTitle("Agenda Title");

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            agendaItemService.createAgendaItem(meetingId, request);
        });
        assertEquals(ErrorCode.MEETING_STATUS_TRANSITION_INVALID, exception.getErrorCode());
    }
}

