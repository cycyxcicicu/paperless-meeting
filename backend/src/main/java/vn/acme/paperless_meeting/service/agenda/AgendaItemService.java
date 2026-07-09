package vn.acme.paperless_meeting.service.agenda;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.agenda.AgendaItemUpsertRequest;
import vn.acme.paperless_meeting.dto.request.agenda.AgendaItemPrepRequest;
import vn.acme.paperless_meeting.dto.request.agenda.BatchOrderRequest;
import java.util.Objects;
import java.util.Set;
import java.util.HashSet;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemResponse;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaDocumentResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingDocument;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.MotionStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingDocumentUsageType;
import vn.acme.paperless_meeting.entity.AgendaItemFeedback;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemFeedbackResponse;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.AppValidationException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.agenda.AgendaItemMapper;
import vn.acme.paperless_meeting.mapper.meeting.MeetingMapper;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingDocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.repository.AgendaItemFeedbackRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.repository.MotionRepository;
import vn.acme.paperless_meeting.mapper.motion.MotionMapper;
import vn.acme.paperless_meeting.entity.Motion;
import vn.acme.paperless_meeting.dto.request.motion.MotionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.PositionCode;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AgendaItemService {

    AgendaItemRepository agendaItemRepository;
    MeetingRepository meetingRepository;
    UserRepository userRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    MeetingDocumentRepository meetingDocumentRepository;
    DocumentRepository documentRepository;
    AgendaItemFeedbackRepository agendaItemFeedbackRepository;
    MotionRepository motionRepository;
    CurrentUserService currentUserService;
    AgendaItemMapper agendaItemMapper;
    MeetingMapper meetingMapper;
    MotionMapper motionMapper;
    WebSocketNotificationService webSocketNotificationService;
    DepartmentService departmentService;
    AuditLogPublisher auditLogPublisher;

    /**
     * Xóa nội dung cuộc họp
     */
    @Transactional
    public void deleteAgendaItem(UUID meetingId, UUID id) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        if (!agendaItem.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND);
        }

        // Xóa liên kết tài liệu đính kèm của Agenda
        meetingDocumentRepository.deleteByAgendaItemId(id);

        // Xóa các vấn đề biểu quyết (motions) của Agenda
        motionRepository.deleteAll(motionRepository.findByAgendaItemId(id));

        agendaItemRepository.delete(agendaItem);
    }

    /**
     * Lấy danh sách nội dung cuộc họp của cuộc họp
     */
    public List<AgendaItemResponse> getAgendaItems(UUID meetingId) {
        Meeting meeting = getMeeting(meetingId);
        User caller = currentUserService.getCurrentActiveUser();
        boolean isCreator = meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId());
        
        // 1. Tải toàn bộ Agenda của cuộc họp kèm theo preparedByUser bằng 1 query duy nhất
        List<AgendaItem> list = agendaItemRepository.findByMeetingIdOrderByOrderNoAscWithPreparer(meetingId);
        
        // 2. Tải toàn bộ tài liệu đính kèm kèm thông tin phiên bản của cuộc họp bằng 1 query duy nhất
        List<MeetingDocument> allDocs = meetingDocumentRepository.findByMeetingIdWithDocsAndVersions(meetingId);
        
        // 3. Gom nhóm tài liệu theo agendaItemId bằng in-memory Map
        Map<UUID, List<MeetingDocument>> docsByAgendaId = allDocs.stream()
                .filter(md -> md.getAgendaItem() != null)
                .collect(Collectors.groupingBy(md -> md.getAgendaItem().getId()));

        // 3.5. Tải toàn bộ danh sách motions của cuộc họp bằng 1 query duy nhất
        List<Motion> allMotions = motionRepository.findByMeetingId(meetingId);
        Map<UUID, List<Motion>> motionsByAgendaId = allMotions.stream()
                .filter(m -> m.getAgendaItem() != null)
                .collect(Collectors.groupingBy(m -> m.getAgendaItem().getId()));

        // 3.6. Tải toàn bộ feedbacks của cuộc họp bằng 1 query duy nhất để tránh N+1 queries
        List<UUID> agendaIds = list.stream().map(AgendaItem::getId).collect(Collectors.toList());
        List<AgendaItemFeedback> allFeedbacks = agendaItemFeedbackRepository.findByAgendaItemIdInOrderByCreatedAtAsc(agendaIds);
        Map<UUID, List<AgendaItemFeedback>> feedbacksByAgendaId = allFeedbacks.stream()
                .filter(fb -> fb.getAgendaItem() != null)
                .collect(Collectors.groupingBy(fb -> fb.getAgendaItem().getId()));
        
        List<MeetingStatus> publishedStatuses = List.of(
            MeetingStatus.APPROVED, MeetingStatus.UPCOMING, MeetingStatus.IN_PROGRESS, 
            MeetingStatus.CLOSED, MeetingStatus.CANCELLED, MeetingStatus.EXPIRED
        );
        boolean isPublished = publishedStatuses.contains(meeting.getStatus());
 
        boolean isSuperAdmin = currentUserService.hasRole(RoleName.SUPER_ADMIN);
        boolean isDeptAdmin = currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN);
        boolean isLeader = caller.getPosition() != null && 
                (PositionCode.CHU_TICH.getCode().equals(caller.getPosition().getPositionCode()) || 
                 PositionCode.GIAM_DOC.getCode().equals(caller.getPosition().getPositionCode()));
        
        boolean tempAccess = isCreator || isSuperAdmin;
        if (!tempAccess && (isDeptAdmin || isLeader) && meeting.getDepartment() != null && caller.getDepartment() != null) {
            List<UUID> subDepts = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
            if (subDepts.contains(meeting.getDepartment().getId())) {
                tempAccess = true;
            }
        }
        final boolean hasAccessToDraftDocs = tempAccess;
 
        // 4. Ánh xạ danh sách Response kết hợp dữ liệu in-memory mà không bị N+1 query
        return list.stream()
                .map(item -> {
                    AgendaItemResponse res = toResponseWithPreloadedDocs(
                            item, 
                            docsByAgendaId.getOrDefault(item.getId(), Collections.emptyList()),
                            motionsByAgendaId.getOrDefault(item.getId(), Collections.emptyList()),
                            feedbacksByAgendaId.getOrDefault(item.getId(), Collections.emptyList())
                    );
                    boolean isPreparerOfThis = item.getPreparedByUser() != null && item.getPreparedByUser().getId().equals(caller.getId());
                    
                    // Nếu không phải người tạo, không phải người được giao chuẩn bị của Agenda này, và không có quyền xem tài liệu nháp
                    if (!isCreator && !isPreparerOfThis && !hasAccessToDraftDocs) {
                        res.setRejectReason(null);
                        
                        // Nếu cuộc họp chưa công bố (đang thảo luận nháp), ẩn luôn tài liệu của Agenda này
                        if (!isPublished) {
                            res.setDocuments(Collections.emptyList());
                        }
                    }
                    return res;
                })
                .collect(Collectors.toList());
    }

    /**
     * Gửi yêu cầu chuẩn bị tài liệu (Trực tiếp từ Người tạo tới Người chuẩn bị)
     */
    @Transactional
    public AgendaItemResponse sendPrepRequest(UUID meetingId, UUID id, AgendaItemPrepRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        if (!agendaItem.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND);
        }

        if (agendaItem.getStatus() != AgendaItemStatus.DRAFT && agendaItem.getStatus() != AgendaItemStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        if (agendaItem.getPreparedByUser() == null) {
            throw new AppException(ErrorCode.USER_ID_REQUIRED);
        }

        if (request != null) {
            if (request.getPrepDeadline() != null) {
                agendaItem.setPrepDeadline(request.getPrepDeadline());
            }
        }

        agendaItem.setStatus(AgendaItemStatus.PENDING_PREPARATION);
        AgendaItem savedAgendaItem = agendaItemRepository.save(agendaItem);

        // Lưu vết lịch sử yêu cầu chuẩn bị tài liệu
        User caller = currentUserService.getCurrentActiveUser();
        String instructionContent = (request != null && request.getContent() != null && !request.getContent().trim().isEmpty()) 
                ? request.getContent() 
                : "Yêu cầu chuẩn bị tài liệu";

        AgendaItemFeedback feedback = AgendaItemFeedback.builder()
                .agendaItem(savedAgendaItem)
                .author(caller)
                .content(instructionContent)
                .type("INSTRUCTION")
                .build();
        agendaItemFeedbackRepository.save(feedback);

        notifyAgendaUpdate(savedAgendaItem, "ASSIGN_PREPARER", "Bạn được gán chuẩn bị tài liệu", caller);

        return toResponseWithDocs(savedAgendaItem);
    }

    /**
     * Người chuẩn bị upload tài liệu đính kèm và gửi yêu cầu phê duyệt cho Người tạo cuộc họp
     */
    @Transactional
    public AgendaItemResponse submitDocs(UUID id, List<UUID> documentIds) {
        return submitDocs(id, documentIds, null);
    }

    @Transactional
    public AgendaItemResponse submitDocs(UUID id, List<UUID> documentIds, String note) {
        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();

        // Thắt chặt phân quyền: Chỉ người chuẩn bị được gán mới có quyền upload/submit docs cho AgendaItem này
        if (agendaItem.getPreparedByUser() == null || !agendaItem.getPreparedByUser().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.AGENDA_SUBMIT_DOCS_FORBIDDEN);
        }

        if (agendaItem.getStatus() != AgendaItemStatus.DRAFT && 
            agendaItem.getStatus() != AgendaItemStatus.PENDING_PREPARATION && 
            agendaItem.getStatus() != AgendaItemStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        // Xóa các liên kết tài liệu cũ do chính người chuẩn bị này tải lên trước đó để tránh trùng lặp
        List<MeetingDocument> existingDocs = meetingDocumentRepository.findByAgendaItemId(agendaItem.getId());
        if (existingDocs != null && !existingDocs.isEmpty()) {
            List<MeetingDocument> callerDocs = existingDocs.stream()
                    .filter(md -> md.getDocument().getCreatedBy() != null && md.getDocument().getCreatedBy().getId().equals(caller.getId()))
                    .collect(Collectors.toList());
            if (!callerDocs.isEmpty()) {
                meetingDocumentRepository.deleteAll(callerDocs);
            }
        }

        // Tạo liên kết đính kèm tài liệu vào AgendaItem
        if (documentIds != null && !documentIds.isEmpty()) {
            // Dùng findAllById + saveAll để tránh N query SELECT + N query INSERT riêng lẻ trong vòng lặp
            List<Document> docs = documentRepository.findAllById(documentIds);
            if (docs.size() != documentIds.size()) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            List<MeetingDocument> meetingDocs = new ArrayList<>();
            for (Document doc : docs) {
                // Chỉ thêm liên kết nếu tài liệu chưa được liên kết với phiên họp (tránh lỗi UNIQUE KEY constraint)
                boolean exists = meetingDocumentRepository.existsByMeetingIdAndDocumentId(agendaItem.getMeeting().getId(), doc.getId());
                if (!exists) {
                    MeetingDocument meetingDoc = new MeetingDocument();
                    meetingDoc.setMeeting(agendaItem.getMeeting());
                    meetingDoc.setDocument(doc);
                    meetingDoc.setAgendaItem(agendaItem);
                    meetingDocs.add(meetingDoc);
                }
            }
            if (!meetingDocs.isEmpty()) {
                meetingDocumentRepository.saveAll(meetingDocs);
            }
        }

        agendaItem.setStatus(AgendaItemStatus.PENDING_APPROVAL);
        agendaItem.setRejectReason(null); // Reset lý do từ chối

        AgendaItem saved = agendaItemRepository.save(agendaItem);

        if (note != null && !note.trim().isEmpty()) {
            AgendaItemFeedback feedback = AgendaItemFeedback.builder()
                    .agendaItem(saved)
                    .author(caller)
                    .content(note.trim())
                    .type("RESPONSE")
                    .createdAt(LocalDateTime.now())
                    .build();
            agendaItemFeedbackRepository.save(feedback);
        }

        AgendaItemResponse response = toResponseWithDocs(saved);

        // Gửi thông báo WebSocket
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + saved.getMeeting().getId() + "/agenda/" + saved.getId() + "/chat",
            response.getFeedbacks()
        );
        if (saved.getMeeting().getCreatedBy() != null) {
            webSocketNotificationService.sendNotificationToUser(
                saved.getMeeting().getCreatedBy().getUsername(),
                "SUBMIT_DOCS",
                "[" + caller.getFullName() + "] - [Phiên họp: " + saved.getMeeting().getTitle() + "] - [Đầu mục: " + saved.getTitle() + "]: Đã nộp tài liệu chuẩn bị",
                Map.of("meetingId", saved.getMeeting().getId().toString(), "agendaItemId", saved.getId().toString())
            );
        }
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + saved.getMeeting().getId(),
            Map.of("action", "REFRESH_MEETING_DETAIL", "status", saved.getMeeting().getStatus().name())
        );
        webSocketNotificationService.sendToTopic(
            "/topic/meeting-updates",
            Map.of("action", "REFRESH_MEETING_LIST", "meetingId", saved.getMeeting().getId().toString())
        );

        return response;
    }

    /**
     * Thêm ý kiến phản hồi / câu hỏi trực tiếp vào mục họp
     */
    @Transactional
    public AgendaItemResponse addFeedback(UUID id, String content, String type) {
        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();

        AgendaItemFeedback feedback = AgendaItemFeedback.builder()
                .agendaItem(agendaItem)
                .author(caller)
                .content(content)
                .type(type)
                .createdAt(LocalDateTime.now())
                .build();
        agendaItemFeedbackRepository.save(feedback);

        AgendaItemResponse response = toResponseWithDocs(agendaItem);

        // Phát WebSocket cập nhật chat
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + agendaItem.getMeeting().getId() + "/agenda/" + agendaItem.getId() + "/chat",
            response.getFeedbacks()
        );

        // Gửi Toast thông báo cá nhân
        User recipient = null;
        if (agendaItem.getMeeting().getCreatedBy() != null && caller.getId().equals(agendaItem.getMeeting().getCreatedBy().getId())) {
            recipient = agendaItem.getPreparedByUser();
        } else {
            recipient = agendaItem.getMeeting().getCreatedBy();
        }
        if (recipient != null) {
            webSocketNotificationService.sendNotificationToUser(
                recipient.getUsername(),
                "NEW_CHAT_MESSAGE",
                "[" + caller.getFullName() + "] - [Phiên họp: " + agendaItem.getMeeting().getTitle() + "] - [Đầu mục: " + agendaItem.getTitle() + "]: " + content,
                Map.of("meetingId", agendaItem.getMeeting().getId().toString(), "agendaItemId", agendaItem.getId().toString())
            );
        }

        return response;
    }

    /**
     * Người tạo cuộc họp duyệt tài liệu nội dung cuộc họp
     */
    @Transactional
    public AgendaItemResponse approveDocs(UUID id) {
        AgendaItem agendaItem = validateAndGetAgendaForApproval(id);
        agendaItem.setStatus(AgendaItemStatus.APPROVED);
        AgendaItem saved = agendaItemRepository.save(agendaItem);
        AgendaItemResponse response = toResponseWithDocs(saved);

        notifyAgendaUpdate(saved, "APPROVE_DOCS", "Tài liệu đã được duyệt", currentUserService.getCurrentActiveUser());

        return response;
    }

    /**
     * Người tạo cuộc họp từ chối tài liệu và trả trực tiếp về cho Người chuẩn bị tài liệu sửa
     */
    @Transactional
    public AgendaItemResponse rejectDocs(UUID id, String reason) {
        AgendaItem agendaItem = validateAndGetAgendaForApproval(id);
        agendaItem.setStatus(AgendaItemStatus.REJECTED);
        agendaItem.setRejectReason(reason);

        AgendaItem savedAgendaItem = agendaItemRepository.save(agendaItem);

        // Lưu vết lịch sử từ chối tài liệu
        User caller = currentUserService.getCurrentActiveUser();
        String rejectContent = (reason != null && !reason.trim().isEmpty()) 
                ? reason 
                : "Từ chối phê duyệt tài liệu";

        AgendaItemFeedback feedback = AgendaItemFeedback.builder()
                .agendaItem(savedAgendaItem)
                .author(caller)
                .content(rejectContent)
                .type("REJECTION")
                .build();
        agendaItemFeedbackRepository.save(feedback);

        AgendaItemResponse response = toResponseWithDocs(savedAgendaItem);

        // Gửi thông báo WebSocket
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + savedAgendaItem.getMeeting().getId() + "/agenda/" + savedAgendaItem.getId() + "/chat",
            response.getFeedbacks()
        );
        notifyAgendaUpdate(savedAgendaItem, "REJECT_DOCS", "Tài liệu bị từ chối duyệt (Lý do: " + rejectContent + ")", caller);

        return response;
    }

    /**
     * Yêu cầu sửa đổi lại nội dung cuộc họp cụ thể sau khi cuộc họp bị Lãnh đạo cấp cao từ chối
     */
    @Transactional
    public AgendaItemResponse reRequest(UUID meetingId, UUID id) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        // Cuộc họp phải ở trạng thái bị Lãnh đạo từ chối
        if (meeting.getStatus() != MeetingStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        if (!agendaItem.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND);
        }

        agendaItem.setStatus(AgendaItemStatus.PENDING_PREPARATION);
        agendaItem.setRejectReason(null);

        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
    }

    /**
     * Bắt đầu điều hành nội dung cuộc họp
     */
    @Transactional
    public AgendaItemResponse startAgenda(UUID meetingId, UUID id) {
        AgendaItem agendaItem = getAgendaAndRequireCreator(meetingId, id);

        // Tự động kết thúc những nội dung đang họp khác
        List<AgendaItem> otherItems = agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meetingId);
        for (AgendaItem item : otherItems) {
            if (!item.getId().equals(id) && item.getStatus() == AgendaItemStatus.IN_PROGRESS) {
                item.setStatus(AgendaItemStatus.DONE);
                item.setEndTime(LocalDateTime.now());
                agendaItemRepository.save(item);
            }
        }

        agendaItem.setStatus(AgendaItemStatus.IN_PROGRESS);
        agendaItem.setStartTime(LocalDateTime.now());
        AgendaItem saved = agendaItemRepository.save(agendaItem);

        // Gửi WebSocket thông báo cho tất cả người tham gia cuộc họp
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + meetingId,
            Map.of(
                "action", "START_AGENDA",
                "agendaId", id.toString(),
                "title", saved.getTitle()
            )
        );

        return toResponseWithDocs(saved);
    }

    /**
     * Hoàn tất phiên điều hành nội dung cuộc họp
     */
    @Transactional
    public AgendaItemResponse completeAgenda(UUID meetingId, UUID id) {
        AgendaItem agendaItem = getAgendaAndRequireCreator(meetingId, id);
        if (agendaItem.getStatus() != AgendaItemStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        agendaItem.setStatus(AgendaItemStatus.DONE);
        agendaItem.setEndTime(LocalDateTime.now());
        AgendaItem saved = agendaItemRepository.save(agendaItem);

        // Gửi WebSocket thông báo
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + meetingId,
            Map.of(
                "action", "COMPLETE_AGENDA",
                "agendaId", id.toString(),
                "title", saved.getTitle()
            )
        );

        return toResponseWithDocs(saved);
    }

    /**
     * Bỏ qua thiết lập nội dung lịch trình hiện tại
     */
    @Transactional
    public AgendaItemResponse skipAgenda(UUID meetingId, UUID id) {
        AgendaItem agendaItem = getAgendaAndRequireCreator(meetingId, id);
        agendaItem.setStatus(AgendaItemStatus.SKIPPED);
        AgendaItem saved = agendaItemRepository.save(agendaItem);

        // Gửi WebSocket thông báo
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + meetingId,
            Map.of(
                "action", "SKIP_AGENDA",
                "agendaId", id.toString(),
                "title", saved.getTitle()
            )
        );

        return toResponseWithDocs(saved);
    }

    /**
     * Lấy danh sách cuộc họp có nội dung được gán chuẩn bị cho User hiện tại
     */
    public List<MeetingResponse> getAssignedPreparationMeetings() {
        User caller = currentUserService.getCurrentActiveUser();
        // Dùng JOIN FETCH để load Meeting (và createdBy, department) cùng lúc, tránh N+1 query
        List<AgendaItem> assignedAgendas = agendaItemRepository.findByPreparedByUserIdWithMeeting(caller.getId());

        return assignedAgendas.stream()
                .map(AgendaItem::getMeeting)
                .distinct()
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật hàng loạt danh sách các Agenda Item của cuộc họp
     */
    @Transactional
    public List<AgendaItemResponse> batchUpdateAgendaItems(UUID meetingId, List<AgendaItemUpsertRequest> requests) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        // 1. Tải toàn bộ agenda items hiện tại của cuộc họp
        List<AgendaItem> existingItems = agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meetingId);
        Map<UUID, AgendaItem> existingMap = existingItems.stream()
                .collect(Collectors.toMap(AgendaItem::getId, item -> item));


        // 3. Tải toàn bộ người chuẩn bị (preparer) để validate in-memory
        Set<UUID> preparedByUserIds = requests.stream()
                .map(AgendaItemUpsertRequest::getPreparedByUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> preparerMap = new java.util.HashMap<>();
        if (!preparedByUserIds.isEmpty()) {
            List<User> preparers = userRepository.findAllById(preparedByUserIds);
            preparerMap = preparers.stream().collect(Collectors.toMap(User::getId, u -> u));
        }

        // 4. Tải toàn bộ tài liệu đính kèm yêu cầu trong các item để validate và liên kết
        Set<UUID> allReqDocIds = requests.stream()
                .flatMap(r -> r.getDocumentIds() == null ? Stream.empty() : r.getDocumentIds().stream())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, Document> docMap = new java.util.HashMap<>();
        if (!allReqDocIds.isEmpty()) {
            List<Document> allDocs = documentRepository.findAllById(allReqDocIds);
            docMap = allDocs.stream().collect(Collectors.toMap(Document::getId, d -> d));
        }

        // 5. Tải toàn bộ MeetingDocument hiện có của cuộc họp
        List<MeetingDocument> allMeetingDocs = meetingDocumentRepository.findByMeetingIdWithDocsAndVersions(meetingId);
        Map<UUID, List<MeetingDocument>> existingDocsByAgendaItem = allMeetingDocs.stream()
                .filter(md -> md.getAgendaItem() != null)
                .collect(Collectors.groupingBy(md -> md.getAgendaItem().getId()));

        // 6. Xác định các item cần giữ lại/cập nhật và các item cần xóa
        Set<UUID> requestIds = requests.stream()
                .map(AgendaItemUpsertRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 7. Xóa các item không có trong request payload
        for (AgendaItem existing : existingItems) {
            if (!requestIds.contains(existing.getId())) {
                // Xóa liên kết tài liệu đính kèm của Agenda
                meetingDocumentRepository.deleteByAgendaItemId(existing.getId());
                // Xóa agenda item
                agendaItemRepository.delete(existing);
            }
        }

        // 8. Tạo hoặc cập nhật các agenda items trong bộ nhớ
        List<AgendaItem> itemsToSave = new ArrayList<>();
        List<AgendaItem> itemsToNotify = new ArrayList<>();
        Map<AgendaItem, List<UUID>> docsToSync = new java.util.HashMap<>();
        Map<AgendaItem, List<MotionUpsertRequest>> motionsToSync = new java.util.HashMap<>();

        for (AgendaItemUpsertRequest req : requests) {
            AgendaItem item;
            if (req.getId() != null) {
                item = existingMap.get(req.getId());
                if (item == null) {
                    throw new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND);
                }
            } else {
                item = new AgendaItem();
                item.setMeeting(meeting);
                item.setStatus(AgendaItemStatus.DRAFT);
            }

            // Check if preparer is newly assigned
            User oldPreparedBy = item.getPreparedByUser();
            User newPreparedBy = null;
            if (req.getPreparedByUserId() != null) {
                newPreparedBy = preparerMap.get(req.getPreparedByUserId());
            }

            boolean isNewAssignment = false;
            if (newPreparedBy != null) {
                if (oldPreparedBy == null || !oldPreparedBy.getId().equals(newPreparedBy.getId())) {
                    isNewAssignment = true;
                }
            }

            // Gán các trường
            item.setTitle(req.getTitle());
            item.setContent(req.getContent());
            item.setDurationEst(req.getDurationEst());
            item.setStartTime(req.getStartTime());
            item.setEndTime(req.getEndTime());
            item.setOrderNo(req.getOrderNo());

            if (req.getPreparedByUserId() != null) {
                User preparedBy = preparerMap.get(req.getPreparedByUserId());
                if (preparedBy == null) {
                    throw new AppException(ErrorCode.USER_NOT_EXISTED);
                }
                item.setPreparedByUser(preparedBy);
            } else {
                item.setPreparedByUser(null);
            }

            if (isNewAssignment) {
                itemsToNotify.add(item);
            }

            itemsToSave.add(item);
            docsToSync.put(item, req.getDocumentIds());
            motionsToSync.put(item, req.getMotions());
        }

        // 9. Kiểm tra thời gian và tính tuần tự trên danh sách bộ nhớ (in-memory) cuối cùng
        validateBatchAgendaTimeAndSequence(meeting, itemsToSave);

        // 10. Lưu toàn bộ danh sách để gán ID
        int tempOrder = -1;
        for (AgendaItem item : itemsToSave) {
            if (item.getId() != null) {
                item.setOrderNo(tempOrder--);
            }
        }
        agendaItemRepository.saveAll(itemsToSave);
        agendaItemRepository.flush();

        // Cập nhật lại orderNo thực tế của từng item
        int idx = 0;
        for (AgendaItemUpsertRequest req : requests) {
            AgendaItem item = itemsToSave.get(idx++);
            item.setOrderNo(req.getOrderNo());
        }
        agendaItemRepository.saveAll(itemsToSave);
        agendaItemRepository.flush();

        // 10.5. Tải toàn bộ feedbacks cho các saved items để tối ưu in-memory
        List<UUID> savedIds = itemsToSave.stream().map(AgendaItem::getId).filter(Objects::nonNull).collect(Collectors.toList());
        List<AgendaItemFeedback> allFeedbacks = agendaItemFeedbackRepository.findByAgendaItemIdInOrderByCreatedAtAsc(savedIds);
        Map<UUID, List<AgendaItemFeedback>> feedbacksByAgendaId = allFeedbacks.stream()
                .filter(fb -> fb.getAgendaItem() != null)
                .collect(Collectors.groupingBy(fb -> fb.getAgendaItem().getId()));

        // 11. Đồng bộ tài liệu đính kèm, biểu quyết và tạo Response
        List<AgendaItemResponse> responses = new ArrayList<>();
        User caller = currentUserService.getCurrentActiveUser();
        for (int i = 0; i < itemsToSave.size(); i++) {
            AgendaItem item = itemsToSave.get(i);
            AgendaItemUpsertRequest req = requests.get(i);
            List<UUID> docIds = docsToSync.get(item);
            List<MeetingDocument> currentMeetingDocs = existingDocsByAgendaItem.getOrDefault(item.getId(), java.util.Collections.emptyList());
            List<MeetingDocument> finalDocs = syncDocumentsOptimized(meetingId, item, docIds, currentMeetingDocs, docMap);
            
            List<MotionUpsertRequest> motionReqs = motionsToSync.get(item);
            List<Motion> finalMotions = syncMotions(meeting, item, motionReqs, caller);
            
            List<AgendaItemFeedback> itemFeedbacks = new ArrayList<>(feedbacksByAgendaId.getOrDefault(item.getId(), Collections.emptyList()));

            if (req.getPrepInstructions() != null) {
                List<AgendaItemFeedback> existingInstructions = itemFeedbacks.stream()
                        .filter(f -> "INSTRUCTION".equals(f.getType()))
                        .collect(Collectors.toList());
                
                if (!existingInstructions.isEmpty()) {
                    AgendaItemFeedback latest = existingInstructions.get(existingInstructions.size() - 1);
                    latest.setContent(req.getPrepInstructions());
                    agendaItemFeedbackRepository.save(latest);
                } else if (!req.getPrepInstructions().trim().isEmpty()) {
                    AgendaItemFeedback newFeedback = AgendaItemFeedback.builder()
                            .agendaItem(item)
                            .author(caller)
                            .content(req.getPrepInstructions())
                            .type("INSTRUCTION")
                            .createdAt(LocalDateTime.now())
                            .build();
                    agendaItemFeedbackRepository.save(newFeedback);
                    itemFeedbacks.add(newFeedback);
                }
            }
            
            responses.add(toResponseWithPreloadedDocs(item, finalDocs, finalMotions, itemFeedbacks));
        }
 
        // Gửi thông báo WebSocket
        for (AgendaItem item : itemsToNotify) {
            if (item.getPreparedByUser() != null) {
                webSocketNotificationService.sendNotificationToUser(
                    item.getPreparedByUser().getUsername(),
                    "ASSIGN_PREPARER",
                    "[" + caller.getFullName() + "] - [Phiên họp: " + item.getMeeting().getTitle() + "] - [Đầu mục: " + item.getTitle() + "]: Bạn được gán chuẩn bị tài liệu",
                    Map.of("meetingId", meetingId.toString(), "agendaItemId", item.getId().toString())
                );
            }
        }
        webSocketNotificationService.sendToTopic(
            "/topic/meeting-updates",
            Map.of("action", "REFRESH_MEETING_LIST", "meetingId", meetingId.toString())
        );
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + meetingId,
            Map.of("action", "REFRESH_AGENDA")
        );

        auditLogPublisher.publish(
                caller,
                AuditAction.UPDATE_AGENDA,
                ResourceType.MEETING,
                meetingId,
                Map.of("meetingId", String.valueOf(meetingId), "title", meeting.getTitle())
        );
 
        return responses;
    }

    private List<Motion> syncMotions(
            Meeting meeting,
            AgendaItem agendaItem,
            List<MotionUpsertRequest> motionRequests,
            User caller) {
        
        // 1. Lấy tất cả các motion hiện tại của agenda item này
        List<Motion> existingMotions = motionRepository.findByAgendaItemId(agendaItem.getId());
        Map<UUID, Motion> existingMap = existingMotions.stream()
                .collect(Collectors.toMap(Motion::getId, m -> m));

        // 2. Xác định danh sách id của motion được yêu cầu giữ lại
        Set<UUID> reqMotionIds = new java.util.HashSet<>();
        if (motionRequests != null) {
            for (MotionUpsertRequest req : motionRequests) {
                if (req.getId() != null) {
                    reqMotionIds.add(req.getId());
                }
            }
        }

        // 3. Xóa các motion cũ không còn trong danh sách yêu cầu
        for (Motion existing : existingMotions) {
            if (!reqMotionIds.contains(existing.getId())) {
                motionRepository.delete(existing);
            }
        }

        List<Motion> finalMotions = new ArrayList<>();

        // 4. Tạo mới hoặc cập nhật các motion được yêu cầu
        if (motionRequests != null) {
            for (MotionUpsertRequest req : motionRequests) {
                Motion motion;
                if (req.getId() != null) {
                    motion = existingMap.get(req.getId());
                    if (motion == null) {
                        throw new AppException(ErrorCode.MOTION_NOT_FOUND);
                    }
                    // Chặn sửa khi biểu quyết đã hoặc đang diễn ra
                    if (motion.getStatus() == MotionStatus.SUBMITTED || motion.getStatus() == MotionStatus.CLOSED) {
                        throw new AppException(ErrorCode.MOTION_ALREADY_VOTED);
                    }
                } else {
                    motion = new Motion();
                    motion.setMeeting(meeting);
                    motion.setAgendaItem(agendaItem);
                    motion.setCreatedBy(caller);
                    motion.setStatus(MotionStatus.DRAFT);
                    motion.setCreatedAt(LocalDateTime.now());
                }

                motion.setTitle(req.getTitle());
                motion.setDescription(req.getDescription());

                finalMotions.add(motionRepository.save(motion));
            }
        }

        return finalMotions;
    }

    private void validateBatchAgendaTimeAndSequence(Meeting meeting, List<AgendaItem> originalList) {
        Map<String, String> errors = new HashMap<>();

        List<AgendaItem> list = new ArrayList<>(originalList);
        // Sắp xếp theo orderNo
        list.sort(Comparator.comparing(AgendaItem::getOrderNo));

        for (int i = 0; i < list.size(); i++) {
            AgendaItem item = list.get(i);
            LocalDateTime startTime = item.getStartTime();
            LocalDateTime endTime = item.getEndTime();

            if (startTime == null || endTime == null) {
                continue;
            }

            if (startTime.isAfter(endTime) || startTime.isEqual(endTime)) {
                errors.put("timeRange_" + i, "Đầu mục " + item.getOrderNo() + ": Thời gian bắt đầu phải trước thời gian kết thúc.");
            }

            if (startTime.isBefore(meeting.getStartTime()) || endTime.isAfter(meeting.getEndTime())) {
                errors.put("timeBound_" + i, "Đầu mục " + item.getOrderNo() + ": Thời gian nội dung cuộc họp phải nằm trong khoảng thời gian cuộc họp (" + meeting.getStartTime() + " - " + meeting.getEndTime() + ").");
            }
        }

        // Validate tính tuần tự không chồng chéo
        for (int i = 1; i < list.size(); i++) {
            AgendaItem prev = list.get(i - 1);
            AgendaItem curr = list.get(i);

            if (prev.getStartTime() == null || prev.getEndTime() == null || curr.getStartTime() == null || curr.getEndTime() == null) {
                continue;
            }

            if (curr.getStartTime().isBefore(prev.getEndTime())) {
                errors.put("sequence_" + i, "Thời gian nội dung cuộc họp không được trùng lặp và phải tuần tự theo Order No (Đầu mục " + curr.getOrderNo() + " phải bắt đầu sau hoặc bằng thời gian kết thúc của đầu mục " + prev.getOrderNo() + ").");
            }
        }

        // Validate trùng lặp thứ tự
        boolean hasDuplicateOrder = list.stream()
                .filter(item -> item.getOrderNo() != null)
                .collect(Collectors.groupingBy(AgendaItem::getOrderNo, Collectors.counting()))
                .values().stream().anyMatch(count -> count > 1);
        if (hasDuplicateOrder) {
            errors.put("orderNo", "Thứ tự của các Agenda không được phép trùng nhau.");
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }
    }

    private List<MeetingDocument> syncDocumentsOptimized(
            UUID meetingId,
            AgendaItem agendaItem,
            List<UUID> documentIds,
            List<MeetingDocument> existingDocs,
            Map<UUID, Document> docMap) {
        
        Set<UUID> reqDocIds = documentIds != null ? new HashSet<>(documentIds) : java.util.Collections.emptySet();
        Set<UUID> existingDocIds = existingDocs.stream()
                .map(md -> md.getDocument().getId())
                .collect(Collectors.toSet());

        List<MeetingDocument> finalDocs = new ArrayList<>();

        User caller = currentUserService.getCurrentActiveUser();

        // 1. Detach removed docs
        for (MeetingDocument md : existingDocs) {
            boolean isUploadedByCaller = md.getDocument().getCreatedBy() != null && 
                                         md.getDocument().getCreatedBy().getId().equals(caller.getId());
            
            if (!reqDocIds.contains(md.getDocument().getId())) {
                if (isUploadedByCaller) {
                    meetingDocumentRepository.delete(md);
                } else {
                    // Giữ lại vì file do người khác tải lên (ví dụ: người chuẩn bị tài liệu)
                    finalDocs.add(md);
                }
            } else {
                finalDocs.add(md);
            }
        }

        // 2. Attach new docs
        for (UUID docId : reqDocIds) {
            if (!existingDocIds.contains(docId)) {
                Document doc = docMap.get(docId);
                if (doc == null) {
                    throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                }
                MeetingDocument md = new MeetingDocument();
                md.setMeeting(meetingRepository.getReferenceById(meetingId));
                md.setAgendaItem(agendaItem);
                md.setDocument(doc);
                md.setUsageType(MeetingDocumentUsageType.AGENDA);
                md.setRequiredBeforeMeeting(false);
                md.setIsConfidential(false);
                meetingDocumentRepository.save(md);
                finalDocs.add(md);
            }
        }
        return finalDocs;
    }

    /**
     * Cập nhật hàng loạt thứ tự các Agenda Item của cuộc họp
     */
    @Transactional
    public void updateAgendaOrders(UUID meetingId, BatchOrderRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        List<BatchOrderRequest.AgendaOrderDto> orders = request.getOrders();
        if (orders == null || orders.isEmpty()) {
            return;
        }

        // 1. Tải toàn bộ agenda items hiện tại của cuộc họp
        List<AgendaItem> items = agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meetingId);
        Map<UUID, AgendaItem> itemMap = items.stream()
                .collect(Collectors.toMap(AgendaItem::getId, item -> item));

        // 2. Gán tạm thời orderNo âm cho tất cả các item có trong yêu cầu để giải phóng ràng buộc Unique
        int tempOrder = -1;
        for (BatchOrderRequest.AgendaOrderDto orderDto : orders) {
            AgendaItem item = itemMap.get(orderDto.getId());
            if (item != null) {
                item.setOrderNo(tempOrder--);
            }
        }
        agendaItemRepository.saveAll(items);
        agendaItemRepository.flush(); // Flush để đẩy thay đổi tạm thời xuống database trước

        // 3. Cập nhật lại orderNo dương đúng vị trí mới
        for (BatchOrderRequest.AgendaOrderDto orderDto : orders) {
            AgendaItem item = itemMap.get(orderDto.getId());
            if (item != null) {
                item.setOrderNo(orderDto.getOrderNo());
            }
        }
        agendaItemRepository.saveAll(items);
    }

    // --- Private Helper Methods ---

    private AgendaItem validateAndGetAgendaForApproval(UUID id) {
        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        Meeting meeting = agendaItem.getMeeting();

        // Thắt chặt phân quyền: Chỉ người tạo cuộc họp mới được phê duyệt
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.AGENDA_APPROVE_FORBIDDEN);
        }

        if (agendaItem.getStatus() != AgendaItemStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        return agendaItem;
    }

    private Meeting getMeeting(UUID id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    private void validateEditPermission(Meeting meeting) {
        User caller = currentUserService.getCurrentActiveUser();
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN);
        }
        if (meeting.getStatus() != MeetingStatus.DRAFT && meeting.getStatus() != MeetingStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }
    }
    private void notifyAgendaUpdate(AgendaItem agendaItem, String action, String message, User caller) {
        if (agendaItem.getPreparedByUser() != null) {
            webSocketNotificationService.sendNotificationToUser(
                agendaItem.getPreparedByUser().getUsername(),
                action,
                "[" + caller.getFullName() + "] - [Phiên họp: " + agendaItem.getMeeting().getTitle() 
                    + "] - [Đầu mục: " + agendaItem.getTitle() + "]: " + message,
                Map.of("meetingId", agendaItem.getMeeting().getId().toString(), 
                       "agendaItemId", agendaItem.getId().toString())
            );
        }
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + agendaItem.getMeeting().getId(),
            Map.of("action", "REFRESH_AGENDA", "status", agendaItem.getMeeting().getStatus().name())
        );
        webSocketNotificationService.sendToTopic(
            "/topic/meeting-updates",
            Map.of("action", "REFRESH_MEETING_LIST", "meetingId", agendaItem.getMeeting().getId().toString())
        );
    }

    private AgendaItem getAgendaAndRequireCreator(UUID meetingId, UUID id) {
        Meeting meeting = getMeeting(meetingId);
        User caller = currentUserService.getCurrentActiveUser();
        
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN);
        }
        if (meeting.getStatus() != MeetingStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        if (!agendaItem.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND);
        }
        return agendaItem;
    }

    private AgendaItemResponse toResponseWithDocs(AgendaItem agendaItem) {
        List<MeetingDocument> mDocs = meetingDocumentRepository.findByAgendaItemId(agendaItem.getId());
        List<Motion> motions = motionRepository.findByAgendaItemId(agendaItem.getId());
        return toResponseWithPreloadedDocs(agendaItem, mDocs, motions);
    }

    private AgendaItemResponse toResponseWithPreloadedDocs(AgendaItem agendaItem, List<MeetingDocument> mDocs, List<Motion> motions) {
        List<AgendaItemFeedback> feedbacks = agendaItemFeedbackRepository.findByAgendaItemIdOrderByCreatedAtAsc(agendaItem.getId());
        return toResponseWithPreloadedDocs(agendaItem, mDocs, motions, feedbacks);
    }

    private AgendaItemResponse toResponseWithPreloadedDocs(AgendaItem agendaItem, List<MeetingDocument> mDocs, List<Motion> motions, List<AgendaItemFeedback> feedbacks) {
        AgendaItemResponse res = agendaItemMapper.toResponse(agendaItem);
        List<AgendaDocumentResponse> docsResponse = new ArrayList<>();
        
        if (mDocs != null) {
            for (MeetingDocument md : mDocs) {
                Document doc = md.getDocument();
                if (doc != null) {
                    var builder = AgendaDocumentResponse.builder()
                            .documentId(doc.getId())
                            .title(doc.getTitle())
                            .usageType(md.getUsageType());
                    
                    if (doc.getCurrentVersion() != null) {
                        builder.fileName(doc.getCurrentVersion().getFileName())
                               .fileUrl(doc.getCurrentVersion().getFileUrl())
                               .fileSize(doc.getCurrentVersion().getFileSize());
                    }
                    if (doc.getCreatedBy() != null) {
                        builder.createdByUserId(doc.getCreatedBy().getId())
                               .createdByFullName(doc.getCreatedBy().getFullName());
                    }
                    docsResponse.add(builder.build());
                }
            }
        }
        res.setDocuments(docsResponse);

        List<AgendaItemFeedbackResponse> fbResponses = feedbacks.stream()
                .map(fb -> AgendaItemFeedbackResponse.builder()
                        .id(fb.getId())
                        .authorName(fb.getAuthor() != null ? fb.getAuthor().getFullName() : "")
                        .content(fb.getContent())
                        .type(fb.getType())
                        .createdAt(fb.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        res.setFeedbacks(fbResponses);

        feedbacks.stream()
                .filter(fb -> "INSTRUCTION".equals(fb.getType()))
                .max(java.util.Comparator.comparing(AgendaItemFeedback::getCreatedAt))
                .ifPresent(fb -> res.setPrepInstructions(fb.getContent()));

        if (motions != null) {
            List<MotionResponse> motionResponses = motions.stream()
                    .map(motionMapper::toResponse)
                    .collect(Collectors.toList());
            res.setMotions(motionResponses);
        } else {
            res.setMotions(Collections.emptyList());
        }

        return res;
    }

    @Transactional(readOnly = true)
    public List<AgendaItemResponse> publicGetAgendaItems(UUID meetingId) {
        Meeting meeting = getMeeting(meetingId);
        List<AgendaItem> list = agendaItemRepository.findByMeetingIdOrderByOrderNoAscWithPreparer(meetingId);
        List<MeetingDocument> allDocs = meetingDocumentRepository.findByMeetingIdWithDocsAndVersions(meetingId);
        
        Map<UUID, List<MeetingDocument>> docsByAgendaId = allDocs.stream()
                .filter(md -> md.getAgendaItem() != null)
                .collect(Collectors.groupingBy(md -> md.getAgendaItem().getId()));

        List<Motion> allMotions = motionRepository.findByMeetingId(meetingId);
        Map<UUID, List<Motion>> motionsByAgendaId = allMotions.stream()
                .filter(m -> m.getAgendaItem() != null)
                .collect(Collectors.groupingBy(m -> m.getAgendaItem().getId()));

        List<UUID> agendaIds = list.stream().map(AgendaItem::getId).collect(Collectors.toList());
        List<AgendaItemFeedback> allFeedbacks = agendaItemFeedbackRepository.findByAgendaItemIdInOrderByCreatedAtAsc(agendaIds);
        Map<UUID, List<AgendaItemFeedback>> feedbacksByAgendaId = allFeedbacks.stream()
                .filter(fb -> fb.getAgendaItem() != null)
                .collect(Collectors.groupingBy(fb -> fb.getAgendaItem().getId()));

        return list.stream()
                .map(item -> {
                    List<MeetingDocument> mDocs = docsByAgendaId.getOrDefault(item.getId(), Collections.emptyList());
                    List<MeetingDocument> publicDocs = mDocs.stream()
                            .filter(md -> md.getIsConfidential() == null || !md.getIsConfidential())
                            .collect(Collectors.toList());
                    return toResponseWithPreloadedDocs(
                            item, 
                            publicDocs,
                            motionsByAgendaId.getOrDefault(item.getId(), Collections.emptyList()),
                            feedbacksByAgendaId.getOrDefault(item.getId(), Collections.emptyList())
                    );
                })
                .collect(Collectors.toList());
    }
}
