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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.agenda.AgendaItemUpsertRequest;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemResponse;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaDocumentResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingDocument;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
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
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

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
    CurrentUserService currentUserService;
    AgendaItemMapper agendaItemMapper;
    MeetingMapper meetingMapper;

    /**
     * Tạo mới một nội dung cuộc họp
     */
    @Transactional
    public AgendaItemResponse createAgendaItem(UUID meetingId, AgendaItemUpsertRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        User preparedBy = null;
        if (request.getPreparedByUserId() != null) {
            // Kiểm tra xem người chuẩn bị có phải đại biểu cuộc họp đã chọn không
            boolean isParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, request.getPreparedByUserId());
            if (!isParticipant) {
                throw new AppException(ErrorCode.AGENDA_PREPARER_NOT_PARTICIPANT);
            }
            preparedBy = userRepository.findById(request.getPreparedByUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        }
        // Kiểm tra thời gian và thứ tự của nội dung cuộc họp
        validateAgendaTimeAndSequence(meetingId, meeting, null, request.getOrderNo(), request.getStartTime(), request.getEndTime());

        AgendaItem agendaItem = agendaItemMapper.toEntity(request);
        agendaItem.setMeeting(meeting);
        agendaItem.setPreparedByUser(preparedBy);
        agendaItem.setStatus(AgendaItemStatus.DRAFT);

        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
    }

    /**
     * Cập nhật nội dung cuộc họp (Chỉ người tạo cuộc họp được phép)
     */
    @Transactional
    public AgendaItemResponse updateAgendaItem(UUID meetingId, UUID id, AgendaItemUpsertRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        User preparedBy = null;
        if (request.getPreparedByUserId() != null) {
            boolean isParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, request.getPreparedByUserId());
            if (!isParticipant) {
                throw new AppException(ErrorCode.AGENDA_PREPARER_NOT_PARTICIPANT);
            }
            preparedBy = userRepository.findById(request.getPreparedByUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        }

        validateAgendaTimeAndSequence(meetingId, meeting, agendaItem, request.getOrderNo(), request.getStartTime(), request.getEndTime());

        agendaItemMapper.updateEntity(request, agendaItem);
        agendaItem.setPreparedByUser(preparedBy);

        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
    }

    /**
     * Xóa nội dung cuộc họp
     */
    @Transactional
    public void deleteAgendaItem(UUID meetingId, UUID id) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        // Xóa liên kết tài liệu đính kèm của Agenda
        meetingDocumentRepository.deleteByAgendaItemId(id);

        agendaItemRepository.delete(agendaItem);
    }

    /**
     * Lấy danh sách nội dung cuộc họp của cuộc họp
     */
    public List<AgendaItemResponse> getAgendaItems(UUID meetingId) {
        getMeeting(meetingId); // verify meeting exists
        
        // 1. Tải toàn bộ danh sách Agenda của cuộc họp kèm theo preparedByUser bằng 1 query duy nhất
        List<AgendaItem> list = agendaItemRepository.findByMeetingIdOrderByOrderNoAscWithPreparer(meetingId);
        
        // 2. Tải toàn bộ tài liệu đính kèm kèm thông tin phiên bản của cuộc họp bằng 1 query duy nhất
        List<MeetingDocument> allDocs = meetingDocumentRepository.findByMeetingIdWithDocsAndVersions(meetingId);
        
        // 3. Gom nhóm tài liệu theo agendaItemId bằng in-memory Map
        Map<UUID, List<MeetingDocument>> docsByAgendaId = allDocs.stream()
                .filter(md -> md.getAgendaItem() != null)
                .collect(Collectors.groupingBy(md -> md.getAgendaItem().getId()));
        
        // 4. Ánh xạ danh sách Response kết hợp dữ liệu in-memory mà không bị N+1 query
        return list.stream()
                .map(item -> toResponseWithPreloadedDocs(item, docsByAgendaId.getOrDefault(item.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    /**
     * Gửi yêu cầu chuẩn bị tài liệu (Trực tiếp từ Người tạo tới Người chuẩn bị)
     */
    @Transactional
    public AgendaItemResponse sendPrepRequest(UUID meetingId, UUID id) {
        Meeting meeting = getMeeting(meetingId);
        validateEditPermission(meeting);

        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        if (agendaItem.getStatus() != AgendaItemStatus.DRAFT && agendaItem.getStatus() != AgendaItemStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        if (agendaItem.getPreparedByUser() == null) {
            throw new AppException(ErrorCode.USER_ID_REQUIRED);
        }

        agendaItem.setStatus(AgendaItemStatus.PENDING_PREPARATION);
        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
    }

    /**
     * Người chuẩn bị upload tài liệu đính kèm và gửi yêu cầu phê duyệt cho Người tạo cuộc họp
     */
    @Transactional
    public AgendaItemResponse submitDocs(UUID id, List<UUID> documentIds) {
        AgendaItem agendaItem = agendaItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();

        // Thắt chặt phân quyền: Chỉ người chuẩn bị được gán mới có quyền upload/submit docs cho AgendaItem này
        if (agendaItem.getPreparedByUser() == null || !agendaItem.getPreparedByUser().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.AGENDA_SUBMIT_DOCS_FORBIDDEN);
        }

        if (agendaItem.getStatus() != AgendaItemStatus.PENDING_PREPARATION && agendaItem.getStatus() != AgendaItemStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        // Tạo liên kết đính kèm tài liệu vào AgendaItem
        if (documentIds != null) {
            for (UUID docId : documentIds) {
                Document doc = documentRepository.findById(docId)
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND)); // Mượn tạm mã lỗi của doc hoặc ném lỗi ko tìm thấy
                
                MeetingDocument meetingDoc = new MeetingDocument();
                meetingDoc.setMeeting(agendaItem.getMeeting());
                meetingDoc.setDocument(doc);
                meetingDoc.setAgendaItem(agendaItem);
                meetingDocumentRepository.save(meetingDoc);
            }
        }

        agendaItem.setStatus(AgendaItemStatus.PENDING_APPROVAL);
        agendaItem.setRejectReason(null); // Reset lý do từ chối

        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
    }

    /**
     * Người tạo cuộc họp duyệt tài liệu nội dung cuộc họp
     */
    @Transactional
    public AgendaItemResponse approveDocs(UUID id) {
        AgendaItem agendaItem = validateAndGetAgendaForApproval(id);
        agendaItem.setStatus(AgendaItemStatus.APPROVED);
        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
    }

    /**
     * Người tạo cuộc họp từ chối tài liệu và trả trực tiếp về cho Người chuẩn bị tài liệu sửa
     */
    @Transactional
    public AgendaItemResponse rejectDocs(UUID id, String reason) {
        AgendaItem agendaItem = validateAndGetAgendaForApproval(id);
        agendaItem.setStatus(AgendaItemStatus.REJECTED);
        agendaItem.setRejectReason(reason);

        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
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

        agendaItem.setStatus(AgendaItemStatus.PENDING_PREPARATION);
        agendaItem.setRejectReason(null);

        return toResponseWithDocs(agendaItemRepository.save(agendaItem));
    }

    /**
     * Lấy danh sách cuộc họp có nội dung được gán chuẩn bị cho User hiện tại
     */
    public List<MeetingResponse> getAssignedPreparationMeetings() {
        User caller = currentUserService.getCurrentActiveUser();
        List<AgendaItem> assignedAgendas = agendaItemRepository.findByPreparedByUserId(caller.getId());
        
        return assignedAgendas.stream()
                .map(AgendaItem::getMeeting)
                .distinct()
                .map(meetingMapper::toResponse)
                .collect(Collectors.toList());
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

    private void validateAgendaTimeAndSequence(UUID meetingId, Meeting meeting, AgendaItem currentAgenda, Integer orderNo, LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return;
        }

        Map<String, String> errors = new HashMap<>();

        if (startTime.isAfter(endTime) || startTime.isEqual(endTime)) {
            errors.put("timeRange", "Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        // Phải nằm trọn vẹn trong khoảng thời gian cuộc họp
        if (startTime.isBefore(meeting.getStartTime()) || endTime.isAfter(meeting.getEndTime())) {
            errors.put("timeBound", "Thời gian nội dung cuộc họp phải nằm trong khoảng thời gian cuộc họp (" + meeting.getStartTime() + " - " + meeting.getEndTime() + ").");
        }

        // Validate tính tuần tự không chồng chéo
        List<AgendaItem> list = new ArrayList<>(agendaItemRepository.findByMeetingIdOrderByOrderNoAsc(meetingId));
        
        // Cập nhật danh sách in-memory để kiểm tra giả lập
        if (currentAgenda != null) {
            list.removeIf(item -> item.getId().equals(currentAgenda.getId()));
        }
        
        AgendaItem simulatedItem = new AgendaItem();
        simulatedItem.setId(currentAgenda != null ? currentAgenda.getId() : UUID.randomUUID());
        simulatedItem.setOrderNo(orderNo);
        simulatedItem.setStartTime(startTime);
        simulatedItem.setEndTime(endTime);
        list.add(simulatedItem);

        // Sắp xếp in-memory
        list.sort(Comparator.comparing(AgendaItem::getOrderNo));

        for (int i = 1; i < list.size(); i++) {
            AgendaItem prev = list.get(i - 1);
            AgendaItem curr = list.get(i);

            if (prev.getStartTime() == null || prev.getEndTime() == null || curr.getStartTime() == null || curr.getEndTime() == null) {
                continue;
            }

            if (curr.getStartTime().isBefore(prev.getEndTime())) {
                errors.put("sequence", "Thời gian nội dung cuộc họp không được trùng lặp và phải tuần tự theo Order No (Đầu mục " + curr.getOrderNo() + " phải bắt đầu sau hoặc bằng thời gian kết thúc của đầu mục " + prev.getOrderNo() + ").");
            }
        }

        if (!errors.isEmpty()) {
            throw new AppValidationException(errors);
        }
    }

    private AgendaItemResponse toResponseWithDocs(AgendaItem agendaItem) {
        List<MeetingDocument> mDocs = meetingDocumentRepository.findByAgendaItemId(agendaItem.getId());
        return toResponseWithPreloadedDocs(agendaItem, mDocs);
    }

    private AgendaItemResponse toResponseWithPreloadedDocs(AgendaItem agendaItem, List<MeetingDocument> mDocs) {
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
                    docsResponse.add(builder.build());
                }
            }
        }
        res.setDocuments(docsResponse);
        return res;
    }
}
