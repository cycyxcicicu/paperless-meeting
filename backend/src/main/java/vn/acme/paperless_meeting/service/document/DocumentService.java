package vn.acme.paperless_meeting.service.document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.document.AttachDocumentRequest;
import vn.acme.paperless_meeting.dto.response.document.DocumentResponse;
import vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.DocumentVersion;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingDocument;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.DocumentStatus;
import vn.acme.paperless_meeting.entity.enums.DocumentType;
import vn.acme.paperless_meeting.entity.enums.MeetingDocumentUsageType;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.document.DocumentMapper;
import vn.acme.paperless_meeting.mapper.document.MeetingDocumentMapper;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.DocumentVersionRepository;
import vn.acme.paperless_meeting.repository.MeetingDocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.service.approval.ApprovalService;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DocumentService {

    DocumentRepository documentRepository;
    DocumentVersionRepository documentVersionRepository;
    MeetingDocumentRepository meetingDocumentRepository;
    MeetingRepository meetingRepository;
    AgendaItemRepository agendaItemRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    FileStorageService fileStorageService;
    CurrentUserService currentUserService;
    ApprovalService approvalService;
    DocumentMapper documentMapper;
    MeetingDocumentMapper meetingDocumentMapper;
    AuditLogPublisher auditLogPublisher;

    // ========== NHÓM A — Document CRUD ==========

    /**
     * Upload file lên MinIO, tạo Document + DocumentVersion.
     */
    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, String title, String docType, String note) {
        User caller = currentUserService.getCurrentActiveUser();

        // 1. Upload file lên MinIO
        StorageResult result = fileStorageService.store(file);

        // 2. Tạo Document
        Document document = new Document();
        document.setTitle(title != null ? title : result.getFileName());
        document.setDocType(parseDocType(docType));
        document.setStatus(DocumentStatus.DRAFT);
        document.setCreatedBy(caller);
        document.setCreatedAt(LocalDateTime.now());
        document.setOwnerDepartment(caller.getDepartment());

        // 3. Tạo DocumentVersion
        DocumentVersion version = new DocumentVersion();
        version.setStorageKey(result.getStorageKey());
        version.setFileUrl(result.getFileUrl());
        version.setFileName(result.getFileName());
        version.setFileSize(result.getFileSize());
        version.setChecksum(result.getChecksum());
        version.setCreatedAt(LocalDateTime.now());
        version.setNote(note);
        version.setCreatedBy(caller);
        version.setDocument(document);

        // 4. Lưu Document (phải save trước để có ID cho FK)
        Document savedDoc = documentRepository.save(document);

        // 5. Lưu Version, set currentVersion
        DocumentVersion savedVersion = documentVersionRepository.save(version);
        savedDoc.setCurrentVersion(savedVersion);
        documentRepository.save(savedDoc);

        auditLogPublisher.publish(
                caller,
                AuditAction.UPLOAD_DOCUMENT,
                ResourceType.DOCUMENT,
                savedDoc.getId(),
                Map.of(
                        "title", String.valueOf(savedDoc.getTitle()),
                        "docType", String.valueOf(savedDoc.getDocType()),
                        "fileName", String.valueOf(savedVersion.getFileName())));

        return documentMapper.toResponse(savedDoc);
    }

    /**
     * Lấy chi tiết Document (kèm currentVersion đã JOIN FETCH).
     */
    @Transactional(readOnly = true)
    public DocumentResponse getDocument(UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        return documentMapper.toResponse(document);
    }

    /**
     * Lấy danh sách tài liệu của user hiện tại.
     */
    @Transactional(readOnly = true)
    public List<DocumentResponse> getMyDocuments() {
        User caller = currentUserService.getCurrentActiveUser();
        List<Document> docs = documentRepository.findByCreatedByIdWithVersion(caller.getId());
        return docs.stream()
                .map(documentMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Xóa Document (soft-delete DB + xóa file trên MinIO).
     * Chỉ cho phép khi: DRAFT, chưa gắn vào meeting nào, là người tạo.
     */
    @Transactional
    public void deleteDocument(UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();

        // Chỉ người tạo mới được xóa
        if (document.getCreatedBy() == null || !document.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.DOCUMENT_DELETE_FORBIDDEN);
        }

        // Chỉ xóa được khi DRAFT
        if (document.getStatus() != DocumentStatus.DRAFT) {
            throw new AppException(ErrorCode.DOCUMENT_CANNOT_DELETE_NON_DRAFT);
        }

        // Không được xóa nếu đang gắn vào meeting nào
        if (documentRepository.isAttachedToAnyMeeting(document.getId())) {
            throw new AppException(ErrorCode.DOCUMENT_ALREADY_ATTACHED);
        }

        // Xóa file trên MinIO (nếu có currentVersion)
        if (document.getCurrentVersion() != null && document.getCurrentVersion().getStorageKey() != null) {
            fileStorageService.delete(document.getCurrentVersion().getStorageKey());
        }

        // Soft-delete (nhờ @SQLDelete trên entity)
        documentRepository.delete(document);

        auditLogPublisher.publish(
                caller,
                AuditAction.DELETE_DOCUMENT,
                ResourceType.DOCUMENT,
                document.getId(),
                Map.of(
                        "title", String.valueOf(document.getTitle())));
    }

    /**
     * Bọc thao tác Upload và Gắn vào Meeting trong 1 giao dịch.
     */
    @Transactional
    public MeetingDocumentResponse uploadAndAttach(UUID meetingId, UUID agendaId, MultipartFile file, String title,
            String docType, String note, MeetingDocumentUsageType usageType, Boolean requiredBeforeMeeting,
            Boolean isConfidential) {
        DocumentResponse docRes = uploadDocument(file, title, docType, note);
        AttachDocumentRequest req = new AttachDocumentRequest();
        req.setDocumentId(docRes.getId());
        req.setUsageType(usageType);
        req.setRequiredBeforeMeeting(requiredBeforeMeeting);
        req.setIsConfidential(isConfidential);
        req.setAgendaItemId(agendaId);
        return attachToMeeting(meetingId, req);
    }

    /**
     * Lấy URL proxy để Download tài liệu có qua vòng kiểm định Authz.
     */
    @Transactional(readOnly = true)
    public String getDownloadUrl(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        boolean isCreator = document.getCreatedBy() != null && document.getCreatedBy().getId().equals(caller.getId());

        if (!isCreator && !currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            List<UUID> meetingIds = new ArrayList<>(
                    meetingDocumentRepository.findMeetingIdsByDocumentId(document.getId()));
            List<String> agendaMeetingIds = meetingRepository.findMeetingIdsByAgendaFileId(document.getId().toString());
            if (agendaMeetingIds != null) {
                for (String midStr : agendaMeetingIds) {
                    try {
                        meetingIds.add(UUID.fromString(midStr));
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
            if (meetingIds.isEmpty()) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            boolean isParticipant = meetingParticipantRepository.isUserParticipantOfAnyMeeting(meetingIds,
                    caller.getId());
            boolean hasApproval = false;
            if (!isParticipant) {
                hasApproval = meetingIds.stream()
                        .anyMatch(meetingId -> approvalService.hasApprovePermission(ResourceType.MEETING, meetingId));
            }
            if (!isParticipant && !hasApproval) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        if (document.getCurrentVersion() == null || document.getCurrentVersion().getStorageKey() == null) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }

        return fileStorageService.getFileUrl(document.getCurrentVersion().getStorageKey());
    }

    @Transactional(readOnly = true)
    public DocumentVersion getDocumentVersion(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        boolean isCreator = document.getCreatedBy() != null && document.getCreatedBy().getId().equals(caller.getId());

        if (!isCreator && !currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            List<UUID> meetingIds = new ArrayList<>(
                    meetingDocumentRepository.findMeetingIdsByDocumentId(document.getId()));
            List<String> agendaMeetingIds = meetingRepository.findMeetingIdsByAgendaFileId(document.getId().toString());
            if (agendaMeetingIds != null) {
                for (String midStr : agendaMeetingIds) {
                    try {
                        meetingIds.add(UUID.fromString(midStr));
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
            if (meetingIds.isEmpty()) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            boolean isParticipant = meetingParticipantRepository.isUserParticipantOfAnyMeeting(meetingIds,
                    caller.getId());
            boolean hasApproval = false;
            if (!isParticipant) {
                hasApproval = meetingIds.stream()
                        .anyMatch(meetingId -> approvalService.hasApprovePermission(ResourceType.MEETING, meetingId));
            }
            if (!isParticipant && !hasApproval) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        if (document.getCurrentVersion() == null || document.getCurrentVersion().getStorageKey() == null) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }

        return document.getCurrentVersion();
    }

    @Transactional(readOnly = true)
    public DocumentVersion getDocumentVersionForPublic(UUID documentId, UUID meetingId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        boolean hasAccess = document.getMeetingDocumentList().stream()
                .anyMatch(md -> md.getMeeting().getId().equals(meetingId)
                        && (md.getIsConfidential() == null || !md.getIsConfidential()));

        if (!hasAccess) {
            Meeting meeting = meetingRepository.findById(meetingId).orElse(null);
            if (meeting != null && meeting.getAgendaFile() != null
                    && documentId.toString().equals(meeting.getAgendaFile().getId())) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        if (document.getCurrentVersion() == null || document.getCurrentVersion().getStorageKey() == null) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }

        return document.getCurrentVersion();
    }

    public java.io.InputStream getFileStream(String storageKey) {
        return fileStorageService.getFileStream(storageKey);
    }

    // ========== NHÓM B — Meeting Document ==========

    /**
     * Gắn Document đã upload vào Meeting.
     */
    @Transactional
    public MeetingDocumentResponse attachToMeeting(UUID meetingId, AttachDocumentRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateMeetingOpenForDocumentMutation(meeting);
        requireMeetingEditPermission(meeting);

        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        if (document.getCreatedBy() == null || !document.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        // Không gắn duplicate
        if (meetingDocumentRepository.existsByMeetingIdAndDocumentId(meetingId, document.getId())) {
            throw new AppException(ErrorCode.DOCUMENT_ALREADY_ATTACHED);
        }

        MeetingDocument meetingDoc = new MeetingDocument();
        meetingDoc.setMeeting(meeting);
        meetingDoc.setDocument(document);
        meetingDoc.setUsageType(request.getUsageType());
        meetingDoc.setRequiredBeforeMeeting(request.getRequiredBeforeMeeting());
        meetingDoc.setIsConfidential(request.getIsConfidential() != null ? request.getIsConfidential() : false);

        // Nếu có agendaItemId → validate thuộc đúng meeting
        if (request.getAgendaItemId() != null) {
            AgendaItem agendaItem = agendaItemRepository.findById(request.getAgendaItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));
            if (!agendaItem.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND);
            }
            if (agendaItem.getStatus() == AgendaItemStatus.DONE || agendaItem.getStatus() == AgendaItemStatus.SKIPPED) {
                throw new AppException(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN);
            }
            meetingDoc.setAgendaItem(agendaItem);
        }

        MeetingDocument saved = meetingDocumentRepository.save(meetingDoc);

        auditLogPublisher.publish(
                currentUserService.getCurrentActiveUser(),
                AuditAction.ATTACH_DOCUMENT,
                ResourceType.DOCUMENT,
                document.getId(),
                Map.of(
                        "meetingId", String.valueOf(meetingId),
                        "usageType", String.valueOf(request.getUsageType())));

        return meetingDocumentMapper.toResponse(saved);
    }

    /**
     * Lấy danh sách tài liệu của Meeting (JOIN FETCH để tránh N+1).
     */
    @Transactional(readOnly = true)
    public List<MeetingDocumentResponse> getMeetingDocuments(UUID meetingId) {
        meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        List<MeetingDocument> meetingDocs = meetingDocumentRepository.findByMeetingIdWithDocsAndVersions(meetingId);
        return meetingDocs.stream()
                .map(meetingDocumentMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Gỡ tài liệu khỏi Meeting (xóa bản ghi MeetingDocument, không xóa Document
     * gốc).
     */
    @Transactional
    public void detachFromMeeting(UUID meetingId, UUID meetingDocId) {
        Meeting meeting = getMeeting(meetingId);

        if (meeting.getStatus() == MeetingStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }
        validateMeetingOpenForDocumentMutation(meeting);
        requireMeetingEditPermission(meeting);

        MeetingDocument meetingDoc = meetingDocumentRepository.findByMeetingIdAndId(meetingId, meetingDocId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_MEETING_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        if (meetingDoc.getDocument().getCreatedBy() == null ||
                !meetingDoc.getDocument().getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.DOCUMENT_DETACH_FORBIDDEN);
        }

        meetingDocumentRepository.delete(meetingDoc);

        auditLogPublisher.publish(
                currentUserService.getCurrentActiveUser(),
                AuditAction.DETACH_DOCUMENT,
                ResourceType.DOCUMENT,
                meetingDoc.getDocument().getId(),
                Map.of(
                        "meetingId", String.valueOf(meetingId)));
    }

    /**
     * Cập nhật thông tin gắn tài liệu (usageType, requiredBeforeMeeting,
     * agendaItem).
     */
    @Transactional
    public MeetingDocumentResponse updateMeetingDocument(UUID meetingId, UUID meetingDocId,
            AttachDocumentRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateMeetingOpenForDocumentMutation(meeting);
        requireMeetingEditPermission(meeting);

        MeetingDocument meetingDoc = meetingDocumentRepository.findByMeetingIdAndId(meetingId, meetingDocId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_MEETING_NOT_FOUND));

        if (request.getUsageType() != null) {
            meetingDoc.setUsageType(request.getUsageType());
        }
        if (request.getRequiredBeforeMeeting() != null) {
            meetingDoc.setRequiredBeforeMeeting(request.getRequiredBeforeMeeting());
        }
        if (request.getIsConfidential() != null) {
            meetingDoc.setIsConfidential(request.getIsConfidential());
        }

        // Update agendaItem link
        if (request.getAgendaItemId() != null) {
            AgendaItem agendaItem = agendaItemRepository.findById(request.getAgendaItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));
            if (!agendaItem.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND);
            }
            if (agendaItem.getStatus() == AgendaItemStatus.DONE || agendaItem.getStatus() == AgendaItemStatus.SKIPPED) {
                throw new AppException(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN);
            }
            meetingDoc.setAgendaItem(agendaItem);
        }

        MeetingDocument saved = meetingDocumentRepository.save(meetingDoc);

        auditLogPublisher.publish(
                currentUserService.getCurrentActiveUser(),
                AuditAction.UPDATE_DOCUMENT,
                ResourceType.DOCUMENT,
                meetingDoc.getDocument().getId(),
                Map.of(
                        "meetingId", String.valueOf(meetingId),
                        "usageType", String.valueOf(request.getUsageType())));

        return meetingDocumentMapper.toResponse(saved);
    }

    // ========== Private helpers ==========

    private Meeting getMeeting(UUID meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    private void validateMeetingOpenForDocumentMutation(Meeting meeting) {
        if (meeting.getStatus() == MeetingStatus.CLOSED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED);
        }
    }

    private void requireMeetingEditPermission(Meeting meeting) {
        User caller = currentUserService.getCurrentActiveUser();
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            return;
        }
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId())) {
            return;
        }

        boolean isChairOrSecretary = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                meeting.getId(), caller.getId(), ParticipantRole.CHAIR)
                || meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                        meeting.getId(), caller.getId(), ParticipantRole.SECRETARY);
        if (isChairOrSecretary) {
            return;
        }

        throw new AppException(ErrorCode.UNAUTHOZIZED);
    }

    private DocumentType parseDocType(String docType) {
        if (docType == null || docType.isBlank()) {
            return DocumentType.OTHER;
        }
        try {
            return DocumentType.valueOf(docType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return DocumentType.OTHER;
        }
    }
}
