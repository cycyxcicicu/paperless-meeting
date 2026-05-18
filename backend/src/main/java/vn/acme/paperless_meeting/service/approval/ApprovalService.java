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
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApprovalService {

    ApprovalRequestRepository approvalRequestRepository;
    ApprovalStepRepository approvalStepRepository;
    MeetingRepository meetingRepository;
    DocumentRepository documentRepository;
    MinutesRepository minutesRepository;
    CurrentUserService currentUserService;
    DepartmentService departmentService;
    ApprovalMapper approvalMapper;

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
        approvalStepRepository.save(firstStep);

        updateResourceStatusOnSubmit(request.getResourceType(), request.getResourceId());
        return getById(saved.getId());
    }

    @Transactional
    public ApprovalRequestResponse approve(UUID approvalId, ApprovalDecisionRequest request) {
        ApprovalRequest approvalRequest = getPendingApproval(approvalId);
        requireApprovePermission(approvalRequest.getResourceType(), approvalRequest.getResourceId());

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

        return getById(approvalRequest.getId());
    }

    @Transactional
    public ApprovalRequestResponse reject(UUID approvalId, ApprovalDecisionRequest request) {
        ApprovalRequest approvalRequest = getPendingApproval(approvalId);
        requireApprovePermission(approvalRequest.getResourceType(), approvalRequest.getResourceId());

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

        return getById(approvalRequest.getId());
    }

    @Transactional
    public ApprovalRequestResponse submitResource(ResourceType resourceType, UUID resourceId, String note) {
        SubmitApprovalRequest request = new SubmitApprovalRequest();
        request.setResourceType(resourceType);
        request.setResourceId(resourceId);
        request.setNote(note);
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
        return approvalMapper.toResponse(approvalRequest);
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestResponse> getHistory(ResourceType resourceType, UUID resourceId) {
        return approvalRequestRepository.findAllByResourceTypeAndResourceIdOrderByRequestedAtDesc(resourceType, resourceId)
                .stream()
                .peek(this::sortSteps)
                .map(approvalMapper::toResponse)
                .toList();
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

    private void requireApprovePermission(ResourceType resourceType, UUID resourceId) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            return;
        }
        if (!currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        UUID resourceDeptId = getResourceDepartmentId(resourceType, resourceId);
        User caller = currentUserService.getCurrentActiveUser();
        if (caller.getDepartment() == null || resourceDeptId == null) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
        List<UUID> subDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
        if (!subDeptIds.contains(resourceDeptId)) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
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
}
