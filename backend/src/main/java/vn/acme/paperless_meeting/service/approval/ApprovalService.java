package vn.acme.paperless_meeting.service.approval;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.approval.ApprovalDecisionRequest;
import vn.acme.paperless_meeting.dto.request.approval.SubmitApprovalRequest;
import vn.acme.paperless_meeting.dto.response.approval.ApprovalRequestResponse;
import vn.acme.paperless_meeting.entity.ApprovalRequest;
import vn.acme.paperless_meeting.entity.ApprovalStep;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.Minutes;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.ApprovalDecision;
import vn.acme.paperless_meeting.entity.enums.ApprovalStatus;
import vn.acme.paperless_meeting.entity.enums.DocumentStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.MinutesStatus;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.approval.ApprovalMapper;
import vn.acme.paperless_meeting.repository.ApprovalRequestRepository;
import vn.acme.paperless_meeting.repository.ApprovalStepRepository;
import vn.acme.paperless_meeting.repository.DocumentRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.MinutesRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.entity.enums.PositionCode;

import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApprovalService {

    ApprovalRequestRepository approvalRequestRepository;
    ApprovalStepRepository approvalStepRepository;
    MeetingRepository meetingRepository;
    DocumentRepository documentRepository;
    MinutesRepository minutesRepository;
    UserRepository userRepository;
    RoleRepository roleRepository;
    CurrentUserService currentUserService;
    DepartmentService departmentService;
    ApprovalMapper approvalMapper;
    AuditLogPublisher auditLogPublisher;
    WebSocketNotificationService webSocketNotificationService;

    @Transactional
    public ApprovalRequestResponse submit(SubmitApprovalRequest request) {
        validateNoPendingApproval(request.getResourceType(), request.getResourceId());
        validateSubmitPermissionAndTransition(request.getResourceType(), request.getResourceId());

        User caller = currentUserService.getCurrentActiveUser();
        ApprovalRequest approvalRequest = new ApprovalRequest();
        approvalRequest.setResourceType(request.getResourceType());
        approvalRequest.setResourceId(request.getResourceId());
        approvalRequest.setRequestedAt(LocalDateTime.now());
        approvalRequest.setStatus(ApprovalStatus.PENDING);
        approvalRequest.setNote(request.getNote());
        approvalRequest.setRequestedBy(caller);

        ApprovalRequest saved = approvalRequestRepository.save(approvalRequest);

        ApprovalStep firstStep = new ApprovalStep();
        firstStep.setApprovalRequest(saved);
        firstStep.setStepNo(1);
        firstStep.setDecision(ApprovalDecision.PENDING);
        
        if (request.getApproverUserId() != null) {
            User approver = userRepository.findById(request.getApproverUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
            firstStep.setApproverUser(approver);
        } else if (request.getApproverRoleId() != null) {
            Role approverRole = roleRepository.findById(request.getApproverRoleId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXIST));
            firstStep.setApproverRole(approverRole);
        }

        approvalStepRepository.save(firstStep);

        updateResourceStatusOnSubmit(request.getResourceType(), request.getResourceId());
        
        auditLogPublisher.publish(caller, AuditAction.SUBMIT_APPROVAL, request.getResourceType(), request.getResourceId(), Map.of("resourceType", request.getResourceType().name(), "approvalId", saved.getId()));

        // Gửi thông báo WebSocket
        if (firstStep.getApproverUser() != null) {
            webSocketNotificationService.sendNotificationToUser(
                firstStep.getApproverUser().getUsername(),
                "MEETING_SUBMITTED",
                "[" + caller.getFullName() + "] - [Phiên họp: " + getResourceTitle(request.getResourceType(), request.getResourceId()) + "]: Gửi yêu cầu phê duyệt phiên họp",
                Map.of("meetingId", request.getResourceId().toString())
            );
        }
        webSocketNotificationService.sendToTopic(
            "/topic/meeting-updates",
            Map.of("action", "REFRESH_MEETING_LIST", "meetingId", request.getResourceId().toString())
        );

        return getById(saved.getId());
    }

    @Transactional
    public ApprovalRequestResponse approve(UUID approvalId, ApprovalDecisionRequest request) {
        ApprovalRequest approvalRequest = getPendingApproval(approvalId);
        requireApprovePermission(approvalRequest);

        ApprovalStep currentStep = getCurrentPendingStep(approvalRequest.getId());
        User caller = currentUserService.getCurrentActiveUser();
        currentStep.setDecision(ApprovalDecision.APPROVED);
        currentStep.setDecidedAt(LocalDateTime.now());
        currentStep.setComment(request != null ? request.getComment() : null);
        currentStep.setApproverUser(caller);
        currentStep.setApproverRole(caller.getRole());
        approvalStepRepository.save(currentStep);

        approvalRequest.setStatus(ApprovalStatus.APPROVED);
        approvalRequestRepository.save(approvalRequest);
        updateResourceStatusOnApprove(approvalRequest.getResourceType(), approvalRequest.getResourceId(), caller, null);

        auditLogPublisher.publish(caller, AuditAction.APPROVE_RESOURCE, approvalRequest.getResourceType(), approvalRequest.getResourceId(), Map.of("approvalId", approvalRequest.getId(), "comment", request != null && request.getComment() != null ? request.getComment() : ""));

        // Gửi thông báo WebSocket
        if (approvalRequest.getRequestedBy() != null) {
            webSocketNotificationService.sendNotificationToUser(
                approvalRequest.getRequestedBy().getUsername(),
                "MEETING_APPROVED",
                "[" + caller.getFullName() + "] - [Phiên họp: " + getResourceTitle(approvalRequest.getResourceType(), approvalRequest.getResourceId()) + "]: Đã phê duyệt phiên họp",
                Map.of("meetingId", approvalRequest.getResourceId().toString())
            );
        }
        webSocketNotificationService.sendToTopic(
            "/topic/meeting-updates",
            Map.of("action", "REFRESH_MEETING_LIST", "meetingId", approvalRequest.getResourceId().toString())
        );
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + approvalRequest.getResourceId(),
            Map.of("action", "REFRESH_MEETING_STATUS", "status", "APPROVED", "rejectReason", "")
        );

        return getById(approvalRequest.getId());
    }

    @Transactional
    public ApprovalRequestResponse reject(UUID approvalId, ApprovalDecisionRequest request) {
        ApprovalRequest approvalRequest = getPendingApproval(approvalId);
        requireApprovePermission(approvalRequest);

        String reason = resolveRejectReason(request);
        ApprovalStep currentStep = getCurrentPendingStep(approvalRequest.getId());
        User caller = currentUserService.getCurrentActiveUser();
        currentStep.setDecision(ApprovalDecision.REJECTED);
        currentStep.setDecidedAt(LocalDateTime.now());
        currentStep.setComment(reason);
        currentStep.setApproverUser(caller);
        currentStep.setApproverRole(caller.getRole());
        approvalStepRepository.save(currentStep);

        approvalRequest.setStatus(ApprovalStatus.REJECTED);
        approvalRequestRepository.save(approvalRequest);
        updateResourceStatusOnReject(approvalRequest.getResourceType(), approvalRequest.getResourceId(), caller, reason);

        auditLogPublisher.publish(caller, AuditAction.REJECT_RESOURCE, approvalRequest.getResourceType(), approvalRequest.getResourceId(), Map.of("approvalId", approvalRequest.getId(), "reason", reason != null ? reason : ""));

        // Gửi thông báo WebSocket
        if (approvalRequest.getRequestedBy() != null) {
            webSocketNotificationService.sendNotificationToUser(
                approvalRequest.getRequestedBy().getUsername(),
                "MEETING_REJECTED",
                "[" + caller.getFullName() + "] - [Phiên họp: " + getResourceTitle(approvalRequest.getResourceType(), approvalRequest.getResourceId()) + "]: Từ chối phê duyệt phiên họp (Lý do: " + (reason != null ? reason : "") + ")",
                Map.of("meetingId", approvalRequest.getResourceId().toString(), "rejectReason", reason != null ? reason : "")
            );
        }
        webSocketNotificationService.sendToTopic(
            "/topic/meeting-updates",
            Map.of("action", "REFRESH_MEETING_LIST", "meetingId", approvalRequest.getResourceId().toString())
        );
        webSocketNotificationService.sendToTopic(
            "/topic/meeting/" + approvalRequest.getResourceId(),
            Map.of("action", "REFRESH_MEETING_STATUS", "status", "REJECTED", "rejectReason", reason != null ? reason : "")
        );

        return getById(approvalRequest.getId());
    }

    @Transactional
    public void cancelApproval(UUID approvalId) {
        ApprovalRequest approvalRequest = approvalRequestRepository.findById(approvalId)
                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        if (approvalRequest.getRequestedBy() == null || !approvalRequest.getRequestedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.APPROVAL_CANCEL_FORBIDDEN);
        }

        if (approvalRequest.getStatus() != ApprovalStatus.PENDING) {
            throw new AppException(ErrorCode.APPROVAL_STATUS_TRANSITION_INVALID);
        }

        ApprovalStep currentStep = getCurrentPendingStep(approvalRequest.getId());
        currentStep.setDecision(ApprovalDecision.CANCELLED);
        currentStep.setDecidedAt(LocalDateTime.now());
        approvalStepRepository.save(currentStep);

        approvalRequest.setStatus(ApprovalStatus.CANCELLED);
        approvalRequestRepository.save(approvalRequest);

        updateResourceStatusOnCancel(approvalRequest.getResourceType(), approvalRequest.getResourceId());
    }

    @Transactional
    public void cancelPendingApprovalByResource(ResourceType resourceType, UUID resourceId) {
        approvalRequestRepository.findFirstByResourceTypeAndResourceIdAndStatus(resourceType, resourceId, ApprovalStatus.PENDING)
                .ifPresent(req -> {
                    req.setStatus(ApprovalStatus.CANCELLED);
                    approvalRequestRepository.save(req);

                    try {
                        ApprovalStep currentStep = getCurrentPendingStep(req.getId());
                        currentStep.setDecision(ApprovalDecision.CANCELLED);
                        currentStep.setDecidedAt(LocalDateTime.now());
                        approvalStepRepository.save(currentStep);
                    } catch (Exception e) {
                        // Bỏ qua nếu không có step để cập nhật
                    }
                });
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestResponse> getPendingApprovals(ResourceType resourceType) {
        List<ApprovalRequest> requests = approvalRequestRepository.findAllPending(resourceType, ApprovalStatus.PENDING);
        return requests.stream()
                .filter(this::hasApprovePermission) // Filter client side check permissions
                .peek(this::sortSteps)
                .map(this::mapToResponseWithTitle)
                .toList();
    }

    @Transactional
    public ApprovalRequestResponse submitResource(ResourceType resourceType, UUID resourceId, String note, UUID approverUserId, UUID approverRoleId) {
        SubmitApprovalRequest request = new SubmitApprovalRequest();
        request.setResourceType(resourceType);
        request.setResourceId(resourceId);
        request.setNote(note);
        request.setApproverUserId(approverUserId);
        request.setApproverRoleId(approverRoleId);
        return submit(request);
    }

    @Transactional
    public ApprovalRequestResponse approveResource(ResourceType resourceType, UUID resourceId, String comment) {
        ApprovalRequest pending = approvalRequestRepository
                .findFirstByResourceTypeAndResourceIdAndStatus(resourceType, resourceId, ApprovalStatus.PENDING)
                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));
        ApprovalDecisionRequest request = new ApprovalDecisionRequest();
        request.setComment(comment);
        return approve(pending.getId(), request);
    }

    @Transactional
    public ApprovalRequestResponse rejectResource(ResourceType resourceType, UUID resourceId, String rejectReason) {
        ApprovalRequest pending = approvalRequestRepository
                .findFirstByResourceTypeAndResourceIdAndStatus(resourceType, resourceId, ApprovalStatus.PENDING)
                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));
        ApprovalDecisionRequest request = new ApprovalDecisionRequest();
        request.setRejectReason(rejectReason);
        return reject(pending.getId(), request);
    }

    @Transactional(readOnly = true)
    public ApprovalRequestResponse getById(UUID id) {
        ApprovalRequest approvalRequest = approvalRequestRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));
        sortSteps(approvalRequest);
        return mapToResponseWithTitle(approvalRequest);
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestResponse> getHistory(ResourceType resourceType, UUID resourceId) {
        return approvalRequestRepository.findAllByResourceTypeAndResourceIdOrderByRequestedAtDesc(resourceType, resourceId)
                .stream()
                .peek(this::sortSteps)
                .map(this::mapToResponseWithTitle)
                .toList();
    }

    private ApprovalRequestResponse mapToResponseWithTitle(ApprovalRequest entity) {
        ApprovalRequestResponse response = approvalMapper.toResponse(entity);
        response.setResourceTitle(getResourceTitle(entity.getResourceType(), entity.getResourceId()));
        return response;
    }

    private String getResourceTitle(ResourceType resourceType, UUID resourceId) {
        try {
            return switch (resourceType) {
                case MEETING -> getMeeting(resourceId).getTitle();
                case DOCUMENT -> getDocument(resourceId).getTitle();
                case MINUTES -> getMinutes(resourceId).getMeeting() != null ? getMinutes(resourceId).getMeeting().getTitle() + " (Biên bản)" : "Biên bản cuộc họp";
                default -> null;
            };
        } catch (Exception e) {
            return null;
        }
    }

    private void validateNoPendingApproval(ResourceType resourceType, UUID resourceId) {
        approvalRequestRepository.findFirstByResourceTypeAndResourceIdAndStatus(resourceType, resourceId, ApprovalStatus.PENDING)
                .ifPresent(existing -> {
                    throw new AppException(ErrorCode.APPROVAL_REQUEST_ALREADY_PENDING);
                });
    }

    private ApprovalRequest getPendingApproval(UUID approvalId) {
        ApprovalRequest approvalRequest = approvalRequestRepository.findById(approvalId)
                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND));
        if (approvalRequest.getStatus() != ApprovalStatus.PENDING) {
            throw new AppException(ErrorCode.APPROVAL_STATUS_TRANSITION_INVALID);
        }
        return approvalRequest;
    }

    private ApprovalStep getCurrentPendingStep(UUID approvalId) {
        return approvalStepRepository
                .findFirstByApprovalRequestIdAndDecisionOrderByStepNoAsc(approvalId, ApprovalDecision.PENDING)
                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_STEP_NOT_FOUND));
    }

    private void validateSubmitPermissionAndTransition(ResourceType resourceType, UUID resourceId) {
        switch (resourceType) {
            case MEETING -> validateMeetingSubmit(resourceId);
            case DOCUMENT -> validateDocumentSubmit(resourceId);
            case MINUTES -> validateMinutesSubmit(resourceId);
            default -> throw new AppException(ErrorCode.APPROVAL_RESOURCE_TYPE_UNSUPPORTED);
        }
    }

    private void updateResourceStatusOnSubmit(ResourceType resourceType, UUID resourceId) {
        switch (resourceType) {
            case MEETING -> {
                Meeting meeting = getMeeting(resourceId);
                meeting.setStatus(MeetingStatus.PENDING_APPROVAL);
                meeting.setRejectReason(null);
                meetingRepository.save(meeting);
            }
            case DOCUMENT -> {
                Document document = getDocument(resourceId);
                document.setStatus(DocumentStatus.IN_REVIEW);
                documentRepository.save(document);
            }
            case MINUTES -> {
                Minutes minutes = getMinutes(resourceId);
                minutes.setStatus(MinutesStatus.SUBMITTED);
                minutesRepository.save(minutes);
            }
            default -> throw new AppException(ErrorCode.APPROVAL_RESOURCE_TYPE_UNSUPPORTED);
        }
    }

    private void updateResourceStatusOnApprove(ResourceType resourceType, UUID resourceId, User approver, String comment) {
        switch (resourceType) {
            case MEETING -> {
                Meeting meeting = getMeeting(resourceId);
                meeting.setStatus(MeetingStatus.APPROVED);
                meeting.setApprovedBy(approver);
                meeting.setApprovedAt(LocalDateTime.now());
                meeting.setRejectReason(null);
                meetingRepository.save(meeting);
            }
            case DOCUMENT -> {
                Document document = getDocument(resourceId);
                document.setStatus(DocumentStatus.APPROVED);
                documentRepository.save(document);
            }
            case MINUTES -> {
                Minutes minutes = getMinutes(resourceId);
                minutes.setStatus(MinutesStatus.APPROVED);
                minutes.setFinalizedAt(LocalDateTime.now());
                minutesRepository.save(minutes);

                auditLogPublisher.publish(
                        approver,
                        AuditAction.PUBLISH_MINUTES,
                        ResourceType.MINUTES,
                        resourceId,
                        Map.of(
                                "minutesId", String.valueOf(resourceId),
                                "title", minutes.getMeeting().getTitle() != null ? minutes.getMeeting().getTitle() : "",
                                "meetingId", minutes.getMeeting().getId() != null ? String.valueOf(minutes.getMeeting().getId()) : ""
                        )
                );
            }
            default -> throw new AppException(ErrorCode.APPROVAL_RESOURCE_TYPE_UNSUPPORTED);
        }
    }

    private void updateResourceStatusOnReject(ResourceType resourceType, UUID resourceId, User approver, String reason) {
        switch (resourceType) {
            case MEETING -> {
                Meeting meeting = getMeeting(resourceId);
                meeting.setStatus(MeetingStatus.REJECTED);
                meeting.setApprovedBy(approver);
                meeting.setApprovedAt(LocalDateTime.now());
                meeting.setRejectReason(reason);
                meetingRepository.save(meeting);
            }
            case DOCUMENT -> {
                Document document = getDocument(resourceId);
                document.setStatus(DocumentStatus.DRAFT);
                documentRepository.save(document);
            }
            case MINUTES -> {
                Minutes minutes = getMinutes(resourceId);
                minutes.setStatus(MinutesStatus.DRAFT);
                minutesRepository.save(minutes);
            }
            default -> throw new AppException(ErrorCode.APPROVAL_RESOURCE_TYPE_UNSUPPORTED);
        }
    }

    private void updateResourceStatusOnCancel(ResourceType resourceType, UUID resourceId) {
        switch (resourceType) {
            case MEETING -> {
                Meeting meeting = getMeeting(resourceId);
                meeting.setStatus(MeetingStatus.DRAFT);
                meetingRepository.save(meeting);
            }
            case DOCUMENT -> {
                Document document = getDocument(resourceId);
                document.setStatus(DocumentStatus.DRAFT);
                documentRepository.save(document);
            }
            case MINUTES -> {
                Minutes minutes = getMinutes(resourceId);
                minutes.setStatus(MinutesStatus.DRAFT);
                minutesRepository.save(minutes);
            }
            default -> throw new AppException(ErrorCode.APPROVAL_RESOURCE_TYPE_UNSUPPORTED);
        }
    }

    private void validateMeetingSubmit(UUID resourceId) {
        Meeting meeting = getMeeting(resourceId);
        requireResourceOwnerOrAdmin(meeting.getCreatedBy(), meeting.getDepartment() != null ? meeting.getDepartment().getId() : null);
        if (meeting.getStatus() != MeetingStatus.DRAFT && meeting.getStatus() != MeetingStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }
    }

    private void validateDocumentSubmit(UUID resourceId) {
        Document document = getDocument(resourceId);
        requireResourceOwnerOrAdmin(document.getCreatedBy(), document.getOwnerDepartment() != null ? document.getOwnerDepartment().getId() : null);
        if (document.getStatus() != DocumentStatus.DRAFT) {
            throw new AppException(ErrorCode.APPROVAL_STATUS_TRANSITION_INVALID);
        }
    }

    private void validateMinutesSubmit(UUID resourceId) {
        Minutes minutes = getMinutes(resourceId);
        requireResourceOwnerOrAdmin(minutes.getCreatedBy(), minutes.getMeeting() != null && minutes.getMeeting().getDepartment() != null
                ? minutes.getMeeting().getDepartment().getId()
                : null);
        if (minutes.getStatus() != MinutesStatus.DRAFT) {
            throw new AppException(ErrorCode.APPROVAL_STATUS_TRANSITION_INVALID);
        }
    }

    private void requireApprovePermission(ApprovalRequest approvalRequest) {
        if (!hasApprovePermission(approvalRequest)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
    }

    private boolean hasApprovePermission(ApprovalRequest approvalRequest) {
        User caller = currentUserService.getCurrentActiveUser();

        // Luôn cho phép SUPER_ADMIN
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            return true;
        }

        // Nếu là phê duyệt cuộc họp (MEETING) và caller là lãnh đạo của đơn vị quản lý cuộc họp đó
        if (approvalRequest.getResourceType() == ResourceType.MEETING) {
            boolean isLeader = caller.getPosition() != null && 
                    (PositionCode.CHU_TICH.getCode().equals(caller.getPosition().getPositionCode()) || PositionCode.GIAM_DOC.getCode().equals(caller.getPosition().getPositionCode()));
            if (isLeader && caller.getDepartment() != null) {
                UUID resourceDeptId = getResourceDepartmentId(approvalRequest.getResourceType(), approvalRequest.getResourceId());
                if (resourceDeptId != null) {
                    List<UUID> subDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
                    if (subDeptIds.contains(resourceDeptId)) {
                        return true;
                    }
                }
            }
        }

        try {
            ApprovalStep currentStep = getCurrentPendingStep(approvalRequest.getId());

            // 1. Kiểm tra đích danh User -> Phải bắt buộc trùng ID
            if (currentStep.getApproverUser() != null) {
                return currentStep.getApproverUser().getId().equals(caller.getId());
            }

            // 2. Kiểm tra đích danh Role -> Phải có Role đó và thỏa mãn quyền theo Department
            if (currentStep.getApproverRole() != null) {
                if (caller.getRole() == null || caller.getRole().getId() == null || !caller.getRole().getId().equals(currentStep.getApproverRole().getId())) {
                    return false;
                }
                if (!currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
                    return false;
                }
                UUID resourceDeptId = getResourceDepartmentId(approvalRequest.getResourceType(), approvalRequest.getResourceId());
                if (caller.getDepartment() == null || resourceDeptId == null) {
                    return false;
                }
                List<UUID> subDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
                return subDeptIds.contains(resourceDeptId);
            }
        } catch (AppException e) {
            // Không lấy được step PENDING
            return false;
        }

        // Trường hợp lỗi dữ liệu (không có đích danh)
        return false;
    }

    private void requireResourceOwnerOrAdmin(User owner, UUID resourceDeptId) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            return;
        }
        User caller = currentUserService.getCurrentActiveUser();
        if (owner != null && owner.getId().equals(caller.getId())) {
            return;
        }
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) && caller.getDepartment() != null && resourceDeptId != null) {
            List<UUID> subDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
            if (subDeptIds.contains(resourceDeptId)) {
                return;
            }
        }
        throw new AppException(ErrorCode.UNAUTHOZIZED);
    }

    private UUID getResourceDepartmentId(ResourceType resourceType, UUID resourceId) {
        return switch (resourceType) {
            case MEETING -> getMeeting(resourceId).getDepartment() != null ? getMeeting(resourceId).getDepartment().getId() : null;
            case DOCUMENT -> getDocument(resourceId).getOwnerDepartment() != null ? getDocument(resourceId).getOwnerDepartment().getId() : null;
            case MINUTES -> getMinutes(resourceId).getMeeting() != null && getMinutes(resourceId).getMeeting().getDepartment() != null
                    ? getMinutes(resourceId).getMeeting().getDepartment().getId()
                    : null;
            default -> throw new AppException(ErrorCode.APPROVAL_RESOURCE_TYPE_UNSUPPORTED);
        };
    }

    private Meeting getMeeting(UUID id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    private Document getDocument(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
    }

    private Minutes getMinutes(UUID id) {
        return minutesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPROVAL_RESOURCE_NOT_FOUND));
    }

    private String resolveRejectReason(ApprovalDecisionRequest request) {
        String reason = request != null && request.getRejectReason() != null && !request.getRejectReason().isBlank()
                ? request.getRejectReason()
                : request != null ? request.getComment() : null;
        if (reason == null || reason.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        return reason;
    }

    private void sortSteps(ApprovalRequest approvalRequest) {
        if (approvalRequest.getApprovalStepList() != null) {
            approvalRequest.getApprovalStepList().sort(Comparator.comparing(ApprovalStep::getStepNo));
        }
    }

    @Transactional(readOnly = true)
    public boolean isApproverOfResource(ResourceType resourceType, UUID resourceId, User user) {
        if (user == null) return false;
        List<ApprovalRequest> requests = approvalRequestRepository.findAllByResourceTypeAndResourceIdOrderByRequestedAtDesc(resourceType, resourceId);
        for (ApprovalRequest req : requests) {
            if (req.getRequestedBy() != null && req.getRequestedBy().getId().equals(user.getId())) {
                return true;
            }
            if (req.getApprovalStepList() != null) {
                for (ApprovalStep step : req.getApprovalStepList()) {
                    if (step.getApproverUser() != null && step.getApproverUser().getId().equals(user.getId())) {
                        return true;
                    }
                    if (step.getApproverRole() != null && user.getRole() != null && step.getApproverRole().getId().equals(user.getRole().getId())) {
                        UUID resourceDeptId = getResourceDepartmentId(resourceType, resourceId);
                        if (user.getDepartment() != null && resourceDeptId != null) {
                            List<UUID> subDeptIds = departmentService.getAllSubDepartmentIds(user.getDepartment().getId());
                            if (subDeptIds.contains(resourceDeptId)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    @Transactional(readOnly = true)
    public boolean hasApprovePermission(ResourceType resourceType, UUID resourceId) {
        return approvalRequestRepository
                .findFirstByResourceTypeAndResourceIdAndStatus(resourceType, resourceId, ApprovalStatus.PENDING)
                .map(this::hasApprovePermission)
                .orElse(false);
    }
}
