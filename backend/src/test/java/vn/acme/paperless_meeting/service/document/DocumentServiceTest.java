package vn.acme.paperless_meeting.service.document;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

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
import org.springframework.web.multipart.MultipartFile;

import vn.acme.paperless_meeting.dto.request.document.AttachDocumentRequest;
import vn.acme.paperless_meeting.dto.response.document.DocumentResponse;
import vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.DocumentVersion;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingDocument;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.DocumentStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingDocumentUsageType;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.document.DocumentMapper;
import vn.acme.paperless_meeting.mapper.document.MeetingDocumentMapper;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.DocumentVersionRepository;
import vn.acme.paperless_meeting.repository.MeetingDocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentServiceTest {

    @Mock DocumentRepository documentRepository;
    @Mock DocumentVersionRepository documentVersionRepository;
    @Mock MeetingDocumentRepository meetingDocumentRepository;
    @Mock MeetingRepository meetingRepository;
    @Mock AgendaItemRepository agendaItemRepository;
    @Mock FileStorageService fileStorageService;
    @Mock CurrentUserService currentUserService;
    @Mock DocumentMapper documentMapper;
    @Mock MeetingDocumentMapper meetingDocumentMapper;

    @InjectMocks
    DocumentService documentService;

    // --- Fixtures ---
    private UUID userId;
    private UUID meetingId;
    private UUID documentId;
    private UUID meetingDocId;

    private User caller;
    private Meeting meeting;
    private Document document;
    private DocumentVersion version;
    private MeetingDocument meetingDoc;

    @BeforeEach
    void setUp() {
        userId      = UUID.randomUUID();
        meetingId   = UUID.randomUUID();
        documentId  = UUID.randomUUID();
        meetingDocId = UUID.randomUUID();

        caller = new User();
        caller.setId(userId);
        caller.setFullName("Test User");

        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setStatus(MeetingStatus.DRAFT);

        version = new DocumentVersion();
        version.setId(UUID.randomUUID());
        version.setStorageKey("test-key.pdf");
        version.setFileUrl("http://localhost:9000/uploads/test-key.pdf");
        version.setFileName("test.pdf");
        version.setFileSize(1024L);

        document = new Document();
        document.setId(documentId);
        document.setTitle("Test Document");
        document.setStatus(DocumentStatus.DRAFT);
        document.setCreatedBy(caller);
        document.setCurrentVersion(version);

        meetingDoc = new MeetingDocument();
        meetingDoc.setId(meetingDocId);
        meetingDoc.setMeeting(meeting);
        meetingDoc.setDocument(document);
        meetingDoc.setUsageType(MeetingDocumentUsageType.AGENDA);

        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
    }

    // =====================================================================
    // uploadDocument
    // =====================================================================

    @Test
    void uploadDocument_Success() {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("report.pdf");
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(1024L);

        StorageResult storageResult = StorageResult.builder()
                .storageKey("uuid.pdf")
                .fileUrl("http://localhost:9000/uploads/uuid.pdf")
                .fileSize(1024L)
                .checksum("abc123")
                .fileName("report.pdf")
                .build();

        when(fileStorageService.store(file)).thenReturn(storageResult);
        when(documentRepository.save(any(Document.class))).thenReturn(document);
        when(documentVersionRepository.save(any(DocumentVersion.class))).thenReturn(version);

        DocumentResponse expectedResponse = DocumentResponse.builder()
                .id(documentId)
                .title("Báo cáo Q1")
                .status(DocumentStatus.DRAFT)
                .build();
        when(documentMapper.toResponse(any(Document.class))).thenReturn(expectedResponse);

        // Act
        DocumentResponse response = documentService.uploadDocument(file, "Báo cáo Q1", "REPORT", "Ghi chú");

        // Assert
        assertNotNull(response);
        assertEquals(DocumentStatus.DRAFT, response.getStatus());
        verify(fileStorageService).store(file);
        verify(documentRepository, times(2)).save(any(Document.class)); // save doc + update currentVersion
        verify(documentVersionRepository).save(any(DocumentVersion.class));
    }

    @Test
    void uploadDocument_NullTitle_UsesFileName() {
        // Arrange
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("auto-name.pdf");
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(512L);

        StorageResult storageResult = StorageResult.builder()
                .storageKey("uuid2.pdf")
                .fileUrl("http://localhost:9000/uploads/uuid2.pdf")
                .fileSize(512L)
                .checksum("def456")
                .fileName("auto-name.pdf")
                .build();

        when(fileStorageService.store(file)).thenReturn(storageResult);
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
            Document d = inv.getArgument(0);
            // khi title null → phải dùng fileName
            assertEquals("auto-name.pdf", d.getTitle());
            d.setId(documentId);
            return d;
        });
        when(documentVersionRepository.save(any(DocumentVersion.class))).thenReturn(version);
        when(documentMapper.toResponse(any(Document.class))).thenReturn(DocumentResponse.builder().build());

        // Act + Assert (không throw)
        assertDoesNotThrow(() -> documentService.uploadDocument(file, null, null, null));
    }

    // =====================================================================
    // getDocument
    // =====================================================================

    @Test
    void getDocument_Success() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        DocumentResponse expected = DocumentResponse.builder().id(documentId).build();
        when(documentMapper.toResponse(document)).thenReturn(expected);

        DocumentResponse result = documentService.getDocument(documentId);

        assertNotNull(result);
        assertEquals(documentId, result.getId());
    }

    @Test
    void getDocument_NotFound_ThrowsException() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> documentService.getDocument(documentId));
        assertEquals(ErrorCode.DOCUMENT_NOT_FOUND, ex.getErrorCode());
    }

    // =====================================================================
    // getMyDocuments
    // =====================================================================

    @Test
    void getMyDocuments_ReturnsList() {
        when(documentRepository.findByCreatedByIdWithVersion(userId)).thenReturn(List.of(document));
        DocumentResponse dto = DocumentResponse.builder().id(documentId).build();
        when(documentMapper.toResponse(document)).thenReturn(dto);

        List<DocumentResponse> result = documentService.getMyDocuments();

        assertEquals(1, result.size());
        assertEquals(documentId, result.get(0).getId());
    }

    // =====================================================================
    // deleteDocument
    // =====================================================================

    @Test
    void deleteDocument_Success() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(documentRepository.isAttachedToAnyMeeting(documentId)).thenReturn(false);

        // Act — không throw
        assertDoesNotThrow(() -> documentService.deleteDocument(documentId));

        verify(fileStorageService).delete("test-key.pdf");
        verify(documentRepository).delete(document);
    }

    @Test
    void deleteDocument_NotOwner_ThrowsForbidden() {
        User anotherUser = new User();
        anotherUser.setId(UUID.randomUUID());
        when(currentUserService.getCurrentActiveUser()).thenReturn(anotherUser);
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

        AppException ex = assertThrows(AppException.class, () -> documentService.deleteDocument(documentId));
        assertEquals(ErrorCode.DOCUMENT_DELETE_FORBIDDEN, ex.getErrorCode());
    }

    @Test
    void deleteDocument_NotDraft_ThrowsException() {
        document.setStatus(DocumentStatus.PUBLISHED);
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

        AppException ex = assertThrows(AppException.class, () -> documentService.deleteDocument(documentId));
        assertEquals(ErrorCode.DOCUMENT_CANNOT_DELETE_NON_DRAFT, ex.getErrorCode());
    }

    @Test
    void deleteDocument_AttachedToMeeting_ThrowsException() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(documentRepository.isAttachedToAnyMeeting(documentId)).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> documentService.deleteDocument(documentId));
        assertEquals(ErrorCode.DOCUMENT_ALREADY_ATTACHED, ex.getErrorCode());
    }

    // =====================================================================
    // attachToMeeting
    // =====================================================================

    @Test
    void attachToMeeting_Success() {
        AttachDocumentRequest request = new AttachDocumentRequest();
        request.setDocumentId(documentId);
        request.setUsageType(MeetingDocumentUsageType.APPENDIX);
        request.setRequiredBeforeMeeting(true);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(meetingDocumentRepository.existsByMeetingIdAndDocumentId(meetingId, documentId)).thenReturn(false);
        when(meetingDocumentRepository.save(any(MeetingDocument.class))).thenReturn(meetingDoc);

        MeetingDocumentResponse expected = MeetingDocumentResponse.builder()
                .id(meetingDocId)
                .usageType(MeetingDocumentUsageType.APPENDIX)
                .build();
        when(meetingDocumentMapper.toResponse(meetingDoc)).thenReturn(expected);

        MeetingDocumentResponse result = documentService.attachToMeeting(meetingId, request);

        assertNotNull(result);
        assertEquals(meetingDocId, result.getId());
        verify(meetingDocumentRepository).save(any(MeetingDocument.class));
    }

    @Test
    void attachToMeeting_MeetingClosed_ThrowsException() {
        meeting.setStatus(MeetingStatus.CLOSED);
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));

        AttachDocumentRequest request = new AttachDocumentRequest();
        request.setDocumentId(documentId);

        AppException ex = assertThrows(AppException.class,
                () -> documentService.attachToMeeting(meetingId, request));
        assertEquals(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED, ex.getErrorCode());
    }

    @Test
    void attachToMeeting_DuplicateDocument_ThrowsException() {
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(meetingDocumentRepository.existsByMeetingIdAndDocumentId(meetingId, documentId)).thenReturn(true);

        AttachDocumentRequest request = new AttachDocumentRequest();
        request.setDocumentId(documentId);

        AppException ex = assertThrows(AppException.class,
                () -> documentService.attachToMeeting(meetingId, request));
        assertEquals(ErrorCode.DOCUMENT_ALREADY_ATTACHED, ex.getErrorCode());
    }

    @Test
    void attachToMeeting_WithAgendaItem_WrongMeeting_ThrowsException() {
        UUID agendaItemId = UUID.randomUUID();
        UUID differentMeetingId = UUID.randomUUID();

        Meeting differentMeeting = new Meeting();
        differentMeeting.setId(differentMeetingId);

        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(agendaItemId);
        agendaItem.setMeeting(differentMeeting); // thuộc meeting khác

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(meetingDocumentRepository.existsByMeetingIdAndDocumentId(meetingId, documentId)).thenReturn(false);
        when(agendaItemRepository.findById(agendaItemId)).thenReturn(Optional.of(agendaItem));

        AttachDocumentRequest request = new AttachDocumentRequest();
        request.setDocumentId(documentId);
        request.setAgendaItemId(agendaItemId);

        AppException ex = assertThrows(AppException.class,
                () -> documentService.attachToMeeting(meetingId, request));
        assertEquals(ErrorCode.AGENDA_ITEM_NOT_FOUND, ex.getErrorCode());
    }

    // =====================================================================
    // getMeetingDocuments
    // =====================================================================

    @Test
    void getMeetingDocuments_Success() {
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(meetingDocumentRepository.findByMeetingIdWithDocsAndVersions(meetingId))
                .thenReturn(List.of(meetingDoc));

        MeetingDocumentResponse dto = MeetingDocumentResponse.builder().id(meetingDocId).build();
        when(meetingDocumentMapper.toResponse(meetingDoc)).thenReturn(dto);

        List<MeetingDocumentResponse> result = documentService.getMeetingDocuments(meetingId);

        assertEquals(1, result.size());
        assertEquals(meetingDocId, result.get(0).getId());
    }

    @Test
    void getMeetingDocuments_MeetingNotFound_ThrowsException() {
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> documentService.getMeetingDocuments(meetingId));
        assertEquals(ErrorCode.MEETING_NOT_EXIST, ex.getErrorCode());
    }

    // =====================================================================
    // detachFromMeeting
    // =====================================================================

    @Test
    void detachFromMeeting_Success() {
        when(meetingDocumentRepository.findByMeetingIdAndId(meetingId, meetingDocId))
                .thenReturn(Optional.of(meetingDoc));

        assertDoesNotThrow(() -> documentService.detachFromMeeting(meetingId, meetingDocId));
        verify(meetingDocumentRepository).delete(meetingDoc);
    }

    @Test
    void detachFromMeeting_NotFound_ThrowsException() {
        when(meetingDocumentRepository.findByMeetingIdAndId(meetingId, meetingDocId))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> documentService.detachFromMeeting(meetingId, meetingDocId));
        assertEquals(ErrorCode.DOCUMENT_MEETING_NOT_FOUND, ex.getErrorCode());
    }

    // =====================================================================
    // updateMeetingDocument
    // =====================================================================

    @Test
    void updateMeetingDocument_Success() {
        when(meetingDocumentRepository.findByMeetingIdAndId(meetingId, meetingDocId))
                .thenReturn(Optional.of(meetingDoc));
        when(meetingDocumentRepository.save(any(MeetingDocument.class))).thenReturn(meetingDoc);

        MeetingDocumentResponse expected = MeetingDocumentResponse.builder()
                .id(meetingDocId)
                .usageType(MeetingDocumentUsageType.MINUTES_ATTACHMENT)
                .requiredBeforeMeeting(false)
                .build();
        when(meetingDocumentMapper.toResponse(meetingDoc)).thenReturn(expected);

        AttachDocumentRequest request = new AttachDocumentRequest();
        request.setUsageType(MeetingDocumentUsageType.MINUTES_ATTACHMENT);
        request.setRequiredBeforeMeeting(false);

        MeetingDocumentResponse result = documentService.updateMeetingDocument(meetingId, meetingDocId, request);

        assertNotNull(result);
        assertEquals(MeetingDocumentUsageType.MINUTES_ATTACHMENT, result.getUsageType());
        assertFalse(result.getRequiredBeforeMeeting());
        verify(meetingDocumentRepository).save(meetingDoc);
    }

    @Test
    void updateMeetingDocument_NotFound_ThrowsException() {
        when(meetingDocumentRepository.findByMeetingIdAndId(meetingId, meetingDocId))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> documentService.updateMeetingDocument(meetingId, meetingDocId, new AttachDocumentRequest()));
        assertEquals(ErrorCode.DOCUMENT_MEETING_NOT_FOUND, ex.getErrorCode());
    }
}
