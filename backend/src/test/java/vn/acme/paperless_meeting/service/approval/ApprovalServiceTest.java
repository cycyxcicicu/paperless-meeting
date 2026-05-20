package vn.acme.paperless_meeting.service.approval;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
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

import vn.acme.paperless_meeting.dto.request.approval.ApprovalDecisionRequest;
import vn.acme.paperless_meeting.dto.request.approval.SubmitApprovalRequest;
import vn.acme.paperless_meeting.dto.response.approval.ApprovalRequestResponse;
import vn.acme.paperless_meeting.entity.ApprovalRequest;
import vn.acme.paperless_meeting.entity.ApprovalStep;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.ApprovalDecision;
import vn.acme.paperless_meeting.entity.enums.ApprovalStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
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

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApprovalServiceTest {

    @Mock ApprovalRequestRepository approvalRequestRepository;
    @Mock ApprovalStepRepository approvalStepRepository;
    @Mock MeetingRepository meetingRepository;
    @Mock DocumentRepository documentRepository;
    @Mock MinutesRepository minutesRepository;
    @Mock CurrentUserService currentUserService;
    @Mock DepartmentService departmentService;
    @Mock ApprovalMapper approvalMapper;
    @Mock vn.acme.paperless_meeting.event.audit.AuditLogPublisher auditLogPublisher;

    @InjectMocks ApprovalService approvalService;

    UUID meetingId;
    UUID approvalId;
    User caller;
    Meeting meeting;

    @BeforeEach
    void setUp() {
        meetingId = UUID.randomUUID();
        approvalId = UUID.randomUUID();

        Department dept = new Department();
        dept.setId(UUID.randomUUID());

        Role role = new Role();
        role.setRoleName(RoleName.DEPARTMENT_ADMIN.name());

        caller = new User();
        caller.setId(UUID.randomUUID());
        caller.setDepartment(dept);
        caller.setRole(role);

        meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setDepartment(dept);
        meeting.setCreatedBy(caller);
        meeting.setStatus(MeetingStatus.DRAFT);
    }

    @Test
    void submit_Meeting_Success() {
        SubmitApprovalRequest req = new SubmitApprovalRequest();
        req.setResourceType(ResourceType.MEETING);
        req.setResourceId(meetingId);

        ApprovalRequest saved = new ApprovalRequest();
        saved.setId(approvalId);
        saved.setResourceType(ResourceType.MEETING);
        saved.setResourceId(meetingId);
        saved.setStatus(ApprovalStatus.PENDING);

        when(approvalRequestRepository.findFirstByResourceTypeAndResourceIdAndStatus(ResourceType.MEETING, meetingId, ApprovalStatus.PENDING))
                .thenReturn(Optional.empty());
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(currentUserService.getCurrentActiveUser()).thenReturn(caller);
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(false);
        when(currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)).thenReturn(false);
        when(approvalRequestRepository.save(any(ApprovalRequest.class))).thenReturn(saved);
        when(approvalRequestRepository.findDetailById(approvalId)).thenReturn(Optional.of(saved));
        when(approvalMapper.toResponse(saved)).thenReturn(ApprovalRequestResponse.builder().id(approvalId).build());

        ApprovalRequestResponse result = approvalService.submit(req);

        assertEquals(approvalId, result.getId());
        verify(approvalStepRepository).save(any(ApprovalStep.class));
        verify(meetingRepository).save(any(Meeting.class));
    }

    @Test
    void reject_WhenReasonBlank_ShouldThrow() {
        ApprovalRequest request = new ApprovalRequest();
        request.setId(approvalId);
        request.setResourceType(ResourceType.MEETING);
        request.setResourceId(meetingId);
        request.setStatus(ApprovalStatus.PENDING);

        when(approvalRequestRepository.findById(approvalId)).thenReturn(Optional.of(request));
        when(currentUserService.hasRole(RoleName.SUPER_ADMIN)).thenReturn(true);

        ApprovalDecisionRequest decisionRequest = new ApprovalDecisionRequest();
        decisionRequest.setRejectReason(" ");

        AppException ex = assertThrows(AppException.class, () -> approvalService.reject(approvalId, decisionRequest));
        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }
}
