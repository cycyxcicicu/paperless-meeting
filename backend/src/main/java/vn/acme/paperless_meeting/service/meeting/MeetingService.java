package vn.acme.paperless_meeting.service.meeting;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingInvitationPreviewRequest;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingInvitationUpdateRequest;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingUpsertRequest;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingInvitationPreviewResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.DocTemplate;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.NotificationType;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.PositionCode;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.event.meeting.MeetingPublishedEvent;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.meeting.MeetingMapper;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.DocTemplateRepository;
import vn.acme.paperless_meeting.repository.LocationRepository;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.repository.SavedMeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.approval.ApprovalService;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.service.document.InvitationPdfService;
import vn.acme.paperless_meeting.service.motion.MotionService;
import vn.acme.paperless_meeting.service.notification.NotificationService;
import vn.acme.paperless_meeting.service.speaker.SpeakerService;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;
import vn.acme.paperless_meeting.specification.meeting.MeetingSpecification;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingService {

    // SpeakerService inject riêng bằng setter để tránh circular dependency
    @lombok.experimental.NonFinal
    private SpeakerService speakerService;

    @Autowired
    public void setSpeakerService(@Lazy SpeakerService speakerService) {
        this.speakerService = speakerService;
    }

    // MotionService inject riêng bằng setter để tránh circular dependency
    @lombok.experimental.NonFinal
    private MotionService motionService;

    @Autowired
    public void setMotionService(@Lazy MotionService motionService) {
        this.motionService = motionService;
    }

    MeetingRepository meetingRepository;
    MeetingMapper meetingMapper;
    CurrentUserService currentUserService;
    DepartmentRepository departmentRepository;
    DepartmentService departmentService;
    LocationRepository locationRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    MeetingGuestRepository meetingGuestRepository;
    DocTemplateRepository docTemplateRepository;
    AgendaItemRepository agendaItemRepository;
    ApprovalService approvalService;
    AuditLogPublisher auditLogPublisher;
    UserRepository userRepository;
    RoleRepository roleRepository;
    NotificationService notificationService;
    InvitationPdfService invitationPdfService;
    ApplicationEventPublisher eventPublisher;
    WebSocketNotificationService webSocketNotificationService;
    SavedMeetingRepository savedMeetingRepository;

    static final Set<MeetingStatus> PUBLISHED_STATUSES = Set.of(
            MeetingStatus.UPCOMING, MeetingStatus.IN_PROGRESS, MeetingStatus.CLOSED, MeetingStatus.CANCELLED,
            MeetingStatus.EXPIRED);

    static final Set<MeetingStatus> CAN_CANCEL_STATUSES = Set.of(
            MeetingStatus.APPROVED, MeetingStatus.UPCOMING, MeetingStatus.PENDING_APPROVAL);

    static final Set<MeetingStatus> CAN_EDIT_STATUSES = Set.of(
            MeetingStatus.DRAFT, MeetingStatus.REJECTED, MeetingStatus.PENDING_APPROVAL, MeetingStatus.APPROVED,
            MeetingStatus.UPCOMING);

    private boolean isLeader(User user) {
        if (user == null || user.getPosition() == null)
            return false;
        String posCode = user.getPosition().getPositionCode();
        return PositionCode.CHU_TICH.getCode().equals(posCode) ||
                PositionCode.GIAM_DOC.getCode().equals(posCode);
    }

    private boolean isLeaderOrAdminOfDepartment(User user, UUID targetDeptId) {
        if (user == null || targetDeptId == null)
            return false;
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN))
            return true;

        boolean isLeader = isLeader(user);
        if ((currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) || isLeader) && user.getDepartment() != null) {
            List<UUID> subDepts = departmentService.getAllSubDepartmentIds(user.getDepartment().getId());
            return subDepts.contains(targetDeptId);
        }
        return false;
    }

    private Department getDepartment(UUID departmentId) {
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXIST));
    }

    private Location getLocation(UUID locationId) {
        if (locationId == null)
            return null;
        return locationRepository.findById(locationId)
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_EXIST));
    }

    /**
     * Tìm kiếm và phân trang danh sách cuộc họp theo bộ lọc (từ khóa, trạng thái,
     * thời gian).
     */
    @Transactional(readOnly = true)
    public PageResponse<MeetingResponse> findAll(String keyword, List<MeetingStatus> statuses,
            InviteStatus inviteStatus, Boolean onlyMyMeetings, LocalDateTime fromDate, LocalDateTime toDate,
            Pageable pageable) {
        User caller = currentUserService.getCurrentActiveUser();
        boolean isSuperAdmin = currentUserService.hasRole(RoleName.SUPER_ADMIN);
        boolean isDeptAdmin = currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN);

        List<UUID> allowedDeptIds = null;
        if (!isSuperAdmin && (isDeptAdmin || isLeader(caller)) && caller.getDepartment() != null) {
            allowedDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
        }

        Specification<Meeting> spec = MeetingSpecification.build(keyword, null, statuses, fromDate, toDate,
                allowedDeptIds, caller.getId(), isSuperAdmin, isDeptAdmin, onlyMyMeetings, inviteStatus);
        Page<Meeting> page = meetingRepository.findAll(spec, pageable);

        return toPageResponse(page);
    }

    public PageResponse<MeetingResponse> toPageResponse(Page<Meeting> page) {
        User caller = currentUserService.getCurrentActiveUser();
        List<Meeting> meetings = page.getContent();
        List<UUID> meetingIds = meetings.stream().map(Meeting::getId).toList();

        List<MeetingParticipant> allParticipants = meetingIds.isEmpty() ? List.of()
                : meetingParticipantRepository.findByMeetingIdIn(meetingIds);
        Map<UUID, List<MeetingParticipant>> participantsByMeetingId = allParticipants.stream()
                .collect(Collectors.groupingBy(p -> p.getMeeting().getId()));

        List<UUID> preparerMeetingIds = meetingIds.isEmpty() ? List.of()
                : agendaItemRepository.findMeetingIdsByPreparedByUserIdAndMeetingIdIn(meetingIds, caller.getId());
        Set<UUID> preparerMeetingIdSet = new HashSet<>(preparerMeetingIds);

        List<MeetingResponse> content = meetings.stream()
                .map(meeting -> {
                    MeetingResponse resp = meetingMapper.toResponse(meeting);
                    List<MeetingParticipant> participants = participantsByMeetingId.getOrDefault(meeting.getId(),
                            List.of());
                    boolean isPreparer = preparerMeetingIdSet.contains(meeting.getId());
                    populateResponseExtraFieldsOptimized(resp, meeting, caller, participants, isPreparer);
                    return resp;
                })
                .toList();

        return PageResponse.<MeetingResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * Lấy danh sách cuộc họp hiển thị trên Lịch (không phân trang).
     */
    @Transactional(readOnly = true)
    public List<MeetingResponse> findCalendarMeetings(LocalDateTime fromDate, LocalDateTime toDate,
            List<MeetingStatus> statuses, Boolean onlyMyMeetings) {
        User caller = currentUserService.getCurrentActiveUser();
        boolean isSuperAdmin = currentUserService.hasRole(RoleName.SUPER_ADMIN);
        boolean isDeptAdmin = currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN);

        List<UUID> allowedDeptIds = null;
        if (!isSuperAdmin && (isDeptAdmin || isLeader(caller)) && caller.getDepartment() != null) {
            allowedDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
        }

        Specification<Meeting> spec = MeetingSpecification.build(null, null, statuses, fromDate, toDate, allowedDeptIds,
                caller.getId(), isSuperAdmin, isDeptAdmin, onlyMyMeetings, null);
        List<Meeting> meetings = meetingRepository.findAll(spec);

        List<UUID> meetingIds = meetings.stream().map(Meeting::getId).toList();

        List<MeetingParticipant> allParticipants = meetingIds.isEmpty() ? List.of()
                : meetingParticipantRepository.findByMeetingIdIn(meetingIds);
        Map<UUID, List<MeetingParticipant>> participantsByMeetingId = allParticipants.stream()
                .collect(Collectors.groupingBy(p -> p.getMeeting().getId()));

        List<UUID> preparerMeetingIds = meetingIds.isEmpty() ? List.of()
                : agendaItemRepository.findMeetingIdsByPreparedByUserIdAndMeetingIdIn(meetingIds, caller.getId());
        Set<UUID> preparerMeetingIdSet = new HashSet<>(preparerMeetingIds);

        return meetings.stream()
                .map(meeting -> {
                    MeetingResponse resp = meetingMapper.toResponse(meeting);
                    List<MeetingParticipant> participants = participantsByMeetingId.getOrDefault(meeting.getId(),
                            List.of());
                    boolean isPreparer = preparerMeetingIdSet.contains(meeting.getId());
                    populateResponseExtraFieldsOptimized(resp, meeting, caller, participants, isPreparer);
                    return resp;
                })
                .toList();
    }

    /**
     * Lấy chi tiết cuộc họp theo ID. Yêu cầu quyền xem cuộc họp.
     */
    public MeetingResponse findById(UUID id) {
        Meeting meeting = getMeeting(id);
        requireViewPermission(meeting);

        MeetingResponse response = meetingMapper.toResponse(meeting);
        User caller = currentUserService.getCurrentActiveUser();
        populateResponseExtraFields(response, meeting, caller);
        return response;
    }

    /**
     * Sidebar: Lấy danh sách cuộc họp đang chờ phê duyệt mà user hiện tại có quyền phê duyệt.
     */
    @Transactional(readOnly = true)
    public List<MeetingResponse> findSidebarApprovalMeetings() {
        User caller = currentUserService.getCurrentActiveUser();
        // Lấy tất cả cuộc họp PENDING_APPROVAL
        List<Meeting> pendingMeetings = meetingRepository.findByStatus(MeetingStatus.PENDING_APPROVAL);

        return pendingMeetings.stream()
                .filter(meeting -> {
                    // Chỉ trả về cuộc họp mà user hiện tại có quyền phê duyệt
                    return approvalService.hasApprovePermission(ResourceType.MEETING, meeting.getId());
                })
                .map(meeting -> {
                    MeetingResponse resp = meetingMapper.toResponse(meeting);
                    populateResponseExtraFields(resp, meeting, caller);
                    return resp;
                })
                .toList();
    }

    /**
     * Sidebar: Lấy danh sách cuộc họp mà user hiện tại cần tải lên hoặc phê duyệt tài liệu.
     * - canUploadDocs = true: User là người chuẩn bị (preparer) và cuộc họp ở DRAFT/REJECTED
     * - canApproveDocs = true: User là người tạo cuộc họp và có đầu mục ở PENDING_APPROVAL
     */
    @Transactional(readOnly = true)
    public List<MeetingResponse> findSidebarDocTaskMeetings() {
        User caller = currentUserService.getCurrentActiveUser();

        // 1. Cuộc họp user được giao chuẩn bị tài liệu (canUploadDocs)
        List<AgendaItem> assignedAgendas = agendaItemRepository.findByPreparedByUserIdWithMeeting(caller.getId());
        Map<UUID, List<AgendaItem>> itemsByMeeting = assignedAgendas.stream()
                .collect(Collectors.groupingBy(a -> a.getMeeting().getId()));

        Set<UUID> uploadMeetingIds = new HashSet<>();
        for (Map.Entry<UUID, List<AgendaItem>> entry : itemsByMeeting.entrySet()) {
            UUID mId = entry.getKey();
            List<AgendaItem> myItems = entry.getValue();
            boolean allApproved = !myItems.isEmpty() && myItems.stream().allMatch(a -> 
                    a.getStatus() == AgendaItemStatus.APPROVED 
                    || a.getStatus() == AgendaItemStatus.DONE 
                    || a.getStatus() == AgendaItemStatus.SKIPPED
            );
            if (!allApproved) {
                uploadMeetingIds.add(mId);
            }
        }

        List<Meeting> uploadMeetings = uploadMeetingIds.isEmpty()
                ? List.of()
                : meetingRepository.findAllById(uploadMeetingIds).stream()
                        .filter(m -> m.getStatus() == MeetingStatus.DRAFT || m.getStatus() == MeetingStatus.REJECTED)
                        .toList();

        // 2. Cuộc họp user tạo có đầu mục chờ phê duyệt (canApproveDocs)
        List<Meeting> createdMeetings = meetingRepository.findByCreatedById(caller.getId());
        List<Meeting> approvalDocMeetings = createdMeetings.stream()
                .filter(m -> agendaItemRepository.existsByMeetingIdAndStatus(m.getId(), AgendaItemStatus.PENDING_APPROVAL))
                .toList();

        // Gộp 2 danh sách, loại trùng
        Set<UUID> addedIds = new HashSet<>();
        List<MeetingResponse> result = new java.util.ArrayList<>();

        for (Meeting m : uploadMeetings) {
            if (addedIds.add(m.getId())) {
                MeetingResponse resp = meetingMapper.toResponse(m);
                populateResponseExtraFields(resp, m, caller);
                result.add(resp);
            }
        }
        for (Meeting m : approvalDocMeetings) {
            if (addedIds.add(m.getId())) {
                MeetingResponse resp = meetingMapper.toResponse(m);
                populateResponseExtraFields(resp, m, caller);
                result.add(resp);
            }
        }

        return result;
    }

    private String determineCallerRole(Meeting meeting, User caller) {
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId())) {
            return "CREATOR";
        }

        var participantOpt = meetingParticipantRepository.findByMeetingIdAndUserId(meeting.getId(), caller.getId());
        if (participantOpt.isPresent()) {
            ParticipantRole role = participantOpt.get().getParticipantRole();
            if (role != null) {
                return role.name();
            }
        }

        boolean isPreparer = agendaItemRepository.existsByMeetingIdAndPreparedByUserId(meeting.getId(), caller.getId());
        if (isPreparer) {
            return "PREPARER";
        }

        return "VIEWER";
    }

    /**
     * Tạo cuộc họp mới ở trạng thái NHÁP. Kiểm tra phân quyền, thời gian và phòng
     * họp.
     */
    @Transactional
    public MeetingResponse create(MeetingUpsertRequest request) {
        if (!currentUserService.canCreateMeeting()) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        validateMeetingTime(request);
        validateLocationConflict(null, request.getLocationId(), request.getStartTime(), request.getEndTime());

        User caller = currentUserService.getCurrentActiveUser();

        Department department = getDepartment(request.getDepartmentId());
        Location location = getLocation(request.getLocationId());

        Meeting meeting = meetingMapper.toEntity(request);
        meeting.setStatus(MeetingStatus.DRAFT);
        meeting.setDepartment(department);
        meeting.setLocation(location);
        meeting.setCreatedBy(caller);

        Meeting savedMeeting = meetingRepository.save(meeting);

        // Tự động thêm người tạo (createdBy) làm thư ký (SECRETARY)
        MeetingParticipant creatorParticipant = new MeetingParticipant();
        creatorParticipant.setMeeting(savedMeeting);
        creatorParticipant.setUser(caller);
        creatorParticipant.setParticipantRole(ParticipantRole.SECRETARY);
        creatorParticipant.setInviteStatus(InviteStatus.ACCEPTED);
        creatorParticipant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);
        meetingParticipantRepository.save(creatorParticipant);

        auditLogPublisher.publish(caller, AuditAction.CREATE_MEETING, ResourceType.MEETING, savedMeeting.getId(),
                Map.of("title", String.valueOf(savedMeeting.getTitle())));

        MeetingResponse resp = meetingMapper.toResponse(savedMeeting);
        populateResponseExtraFields(resp, savedMeeting, caller);
        return resp;
    }

    /**
     * Cập nhật thông tin cuộc họp. Chỉ cho phép chỉnh sửa khi ở trạng thái NHÁP
     * hoặc BỊ TỪ CHỐI.
     */
    @Transactional
    public MeetingResponse update(UUID id, MeetingUpsertRequest request) {
        Meeting meeting = getMeeting(id);
        requireEditPermission(meeting);

        if (meeting.getStatus() != MeetingStatus.DRAFT && meeting.getStatus() != MeetingStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        validateMeetingTime(request);
        validateLocationConflict(id, request.getLocationId(), request.getStartTime(), request.getEndTime());

        Department department = getDepartment(request.getDepartmentId());
        Location location = getLocation(request.getLocationId());

        meetingMapper.updateEntity(request, meeting);
        meeting.setDepartment(department);
        meeting.setLocation(location);

        Meeting savedMeeting = meetingRepository.save(meeting);

        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.UPDATE_MEETING,
                ResourceType.MEETING, savedMeeting.getId(), Map.of("title", String.valueOf(savedMeeting.getTitle())));

        MeetingResponse resp = meetingMapper.toResponse(savedMeeting);
        populateResponseExtraFields(resp, savedMeeting, currentUserService.getCurrentActiveUser());
        return resp;
    }

    /**
     * Cập nhật thông tin thư mời của cuộc họp.
     */
    @Transactional
    public void updateInvitation(UUID id, MeetingInvitationUpdateRequest request) {
        Meeting meeting = getMeeting(id);
        requireEditPermission(meeting);

        meeting.setRequiresInvitation(request.getRequiresInvitation());
        meeting.setInvitationTemplateId(request.getInvitationTemplateId());
        meeting.setInvitationContent(request.getInvitationContent());

        meetingRepository.save(meeting);
    }

    /**
     * Trình duyệt cuộc họp. Cần ID đích danh người duyệt
     */
    @Transactional
    public void submitForApproval(UUID id) {
        submitForApproval(id, null, null);
    }

    @Transactional
    public void submitForApproval(UUID id, UUID approverUserId, UUID approverRoleId) {
        Meeting meeting = getMeeting(id);
        requireEditPermission(meeting);

        if (meeting.getStatus() != MeetingStatus.DRAFT && meeting.getStatus() != MeetingStatus.REJECTED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        if (meeting.getStartTime() == null || meeting.getStartTime().isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new AppException(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES);
        }

        if (meeting.getAgendaItemList() != null && !meeting.getAgendaItemList().isEmpty()) {
            boolean hasUnapprovedAgenda = meeting.getAgendaItemList().stream()
                    .filter(agenda -> agenda.getPreparedByUser() != null)
                    .anyMatch(agenda -> agenda.getStatus() != AgendaItemStatus.APPROVED);
            if (hasUnapprovedAgenda) {
                throw new AppException(ErrorCode.AGENDA_NOT_APPROVED);
            }
        }

        long chairCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(id, ParticipantRole.CHAIR);
        if (chairCount == 0) {
            throw new AppException(ErrorCode.MEETING_CHAIR_REQUIRED);
        }
        if (chairCount > 3) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        long secretaryCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(id,
                ParticipantRole.SECRETARY);
        if (secretaryCount == 0) {
            throw new AppException(ErrorCode.MEETING_SECRETARY_REQUIRED);
        }

        UUID finalApproverUserId = approverUserId;
        UUID finalApproverRoleId = approverRoleId;

        if (finalApproverUserId != null) {
            User approver = userRepository.findById(finalApproverUserId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

            if (!isLeader(approver) || approver.getDepartment() == null || meeting.getDepartment() == null) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            List<UUID> allowedSubDeptIds = departmentService.getAllSubDepartmentIds(approver.getDepartment().getId());
            if (!allowedSubDeptIds.contains(meeting.getDepartment().getId())) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        } else if (finalApproverRoleId == null) {
            List<User> leaders = new java.util.ArrayList<>();
            Department currentDept = meeting.getDepartment();
            while (currentDept != null && leaders.isEmpty()) {
                leaders = userRepository.findActiveLeadersByDepartmentId(currentDept.getId());
                currentDept = currentDept.getParentDepartment();
            }

            if (!leaders.isEmpty()) {
                finalApproverUserId = leaders.get(0).getId();
            } else {
                Role deptAdminRole = roleRepository.findByRoleCode(RoleName.DEPARTMENT_ADMIN.name()).orElse(null);
                if (deptAdminRole != null) {
                    finalApproverRoleId = deptAdminRole.getId();
                }
            }
        }

        approvalService.submitResource(ResourceType.MEETING, id, null, finalApproverUserId, finalApproverRoleId);
    }

    /**
     * Phê duyệt cuộc họp. Chuyển trạng thái sang ĐÃ DUYỆT.
     */
    @Transactional
    public void approve(UUID id) {
        approvalService.approveResource(ResourceType.MEETING, id, null);
    }

    /**
     * Công bố cuộc họp đã được phê duyệt sang trạng thái SẮP DIỄN RA.
     */
    @Transactional
    public void publish(UUID id) {
        Meeting meeting = getMeeting(id);
        User caller = currentUserService.getCurrentActiveUser();
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        if (meeting.getStatus() != MeetingStatus.APPROVED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        if (meeting.getStartTime() == null || meeting.getStartTime().isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new AppException(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES);
        }

        meeting.setStatus(MeetingStatus.UPCOMING);
        meetingRepository.save(meeting);

        // Gửi thông báo WebSocket để cập nhật UI danh sách và chi tiết cuộc họp
        webSocketNotificationService.sendToTopic(
                "/topic/meeting-updates",
                Map.of("action", "REFRESH_MEETING_LIST", "meetingId", meeting.getId().toString()));
        webSocketNotificationService.sendToTopic(
                "/topic/meeting/" + meeting.getId(),
                Map.of("action", "REFRESH_MEETING_STATUS", "status", "UPCOMING", "rejectReason", ""));

        // Kích hoạt gửi mail bất đồng bộ qua event và RabbitMQ sau khi commit giao dịch
        eventPublisher.publishEvent(new MeetingPublishedEvent(this, meeting.getId()));
    }

    @Transactional
    public void revertToDraft(UUID id) {
        Meeting meeting = getMeeting(id);
        requireEditPermission(meeting);
        if (meeting.getStatus() != MeetingStatus.APPROVED) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }
        meeting.setStatus(MeetingStatus.DRAFT);
        meetingRepository.save(meeting);
        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.UPDATE_MEETING,
                ResourceType.MEETING, meeting.getId(),
                Map.of("title", String.valueOf(meeting.getTitle()), "action", "REVERT_TO_DRAFT"));

        // Gửi thông báo WebSocket
        webSocketNotificationService.sendToTopic(
                "/topic/meeting-updates",
                Map.of("action", "REFRESH_MEETING_LIST", "meetingId", meeting.getId().toString()));
        webSocketNotificationService.sendToTopic(
                "/topic/meeting/" + meeting.getId(),
                Map.of("action", "REFRESH_MEETING_STATUS", "status", "DRAFT", "rejectReason", ""));
    }

    /**
     * Từ chối phê duyệt cuộc họp kèm theo lý do. Chuyển trạng thái sang BỊ TỪ CHỐI.
     */
    @Transactional
    public void reject(UUID id, String rejectReason) {
        approvalService.rejectResource(ResourceType.MEETING, id, rejectReason);
    }

    /**
     * Hủy cuộc họp sắp diễn ra hoặc đang chờ duyệt kèm lý do. Chuyển trạng thái
     * sang ĐÃ HỦY.
     */
    @Transactional
    public void cancel(UUID id, String cancelReason) {
        Meeting meeting = getMeeting(id);
        User caller = currentUserService.getCurrentActiveUser();
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        if (meeting.getStatus() != MeetingStatus.UPCOMING
                && meeting.getStatus() != MeetingStatus.APPROVED
                && meeting.getStatus() != MeetingStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        if (cancelReason == null || cancelReason.trim().isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        // Tự động triệt tiêu phiếu trình duyệt nếu cuộc họp đang PENDING_APPROVAL
        if (meeting.getStatus() == MeetingStatus.PENDING_APPROVAL) {
            approvalService.cancelPendingApprovalByResource(ResourceType.MEETING, meeting.getId());
        }

        meeting.setStatus(MeetingStatus.CANCELLED);
        meeting.setCancelReason(cancelReason);
        meetingRepository.save(meeting);

        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.CANCEL_MEETING,
                ResourceType.MEETING, meeting.getId(),
                Map.of("title", String.valueOf(meeting.getTitle()), "cancelReason", cancelReason));

        // Gửi thông báo đến các thành viên trong cuộc họp
        try {
            List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meeting.getId());
            log.info("[CANCEL] Found {} participants for meetingId={}", participants.size(), meeting.getId());
            for (MeetingParticipant p : participants) {
                log.info("[CANCEL] Participant: id={}, userId={}, username={}",
                        p.getId(),
                        p.getUser() != null ? p.getUser().getId() : "NULL",
                        p.getUser() != null ? p.getUser().getUsername() : "NULL");
            }
            String msg = String.format("Phiên họp \"%s\" đã bị hủy. Lý do: %s",
                    meeting.getTitle(), cancelReason);

            notificationService.notifyParticipants(
                    participants,
                    currentUserService.getCurrentActiveUser(),
                    msg,
                    NotificationType.MEETING_CANCELLED,
                    ResourceType.MEETING,
                    meeting.getId(),
                    "MEETING_CANCELLED",
                    Map.of("meetingId", meeting.getId().toString()));

            notificationService.broadcastTopic(
                    "/topic/meeting-updates",
                    Map.of("action", "REFRESH_MEETING_LIST", "meetingId", meeting.getId().toString()));
            notificationService.broadcastTopic(
                    "/topic/meeting/" + meeting.getId(),
                    Map.of("action", "REFRESH_MEETING_STATUS", "status", "CANCELLED", "rejectReason", "",
                            "cancelReason", cancelReason));
        } catch (Exception e) {
            log.error("Failed to send cancel notifications", e);
        }
    }

    /**
     * Kết thúc cuộc họp đang diễn ra. Chuyển trạng thái sang ĐÃ KẾT THÚC.
     */
    @Transactional
    public void close(UUID id) {
        Meeting meeting = getMeeting(id);
        requireEditPermission(meeting);

        if (meeting.getStatus() != MeetingStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        meeting.setStatus(MeetingStatus.CLOSED);
        meetingRepository.save(meeting);

        // SPEAKER-08: Đóng tất cả hàng chờ và lượt phát biểu còn active
        speakerService.closeAllQueuesAndTurns(id);

        // VOTE-14: Đóng tất cả phiên biểu quyết còn mở
        motionService.closeAllOpenVoteSessions(id);

        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.CLOSE_MEETING,
                ResourceType.MEETING, meeting.getId(), Map.of("title", String.valueOf(meeting.getTitle())));
    }

    /**
     * Xóa cuộc họp NHÁP. Dữ liệu sẽ được ẩn bằng soft delete.
     */
    @Transactional
    public void delete(UUID id) {
        Meeting meeting = getMeeting(id);
        User caller = currentUserService.getCurrentActiveUser();
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
        if (meeting.getStatus() != MeetingStatus.DRAFT) {
            throw new AppException(ErrorCode.MEETING_ONLY_DRAFT_ALLOWED);
        }
        meetingRepository.delete(meeting);
        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.DELETE_MEETING,
                ResourceType.MEETING, meeting.getId(), Map.of("title", String.valueOf(meeting.getTitle())));
    }

    /**
     * Khôi phục cuộc họp đã bị xóa.
     */
    @Transactional
    public void restore(UUID id) {
        Meeting meeting = meetingRepository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
        requireEditPermission(meeting);
        if (meeting.getIsDeleted() == null || !meeting.getIsDeleted()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        meetingRepository.restoreMeetingNative(id);
        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.UPDATE_MEETING,
                ResourceType.MEETING, meeting.getId(),
                Map.of("title", String.valueOf(meeting.getTitle()), "action", "RESTORE"));
    }

    /**
     * Tìm cuộc họp theo ID. Ném ngoại lệ nếu không tồn tại.
     */
    private Meeting getMeeting(UUID id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    /**
     * Xác thực thời gian họp (phải lên lịch trước ít nhất 30 phút, kết thúc sau bắt
     * đầu).
     */
    private void validateMeetingTime(MeetingUpsertRequest request) {
        LocalDateTime start = request.getStartTime();
        LocalDateTime end = request.getEndTime();
        if (start == null || end == null || !end.isAfter(start)) {
            throw new AppException(ErrorCode.MEETING_INVALID_TIME_RANGE);
        }
        if (start.isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new AppException(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES);
        }

        if (request.getRsvpDeadline() == null) {
            request.setRsvpDeadline(start);
        } else if (request.getRsvpDeadline().isAfter(start)) {
            throw new AppException(ErrorCode.MEETING_INVALID_RSVP_DEADLINE);
        }
    }

    /**
     * Kiểm tra trùng lịch phòng họp đối với các cuộc họp có hiệu lực.
     */
    private void validateLocationConflict(UUID meetingId, UUID locationId, LocalDateTime start, LocalDateTime end) {
        if (locationId == null)
            return;

        // Chỉ kiểm tra trùng lịch với cuộc họp có hiệu lực (APPROVED, UPCOMING,
        // IN_PROGRESS, PENDING_APPROVAL)
        List<MeetingStatus> conflictStatuses = List.of(
                MeetingStatus.APPROVED,
                MeetingStatus.UPCOMING,
                MeetingStatus.IN_PROGRESS,
                MeetingStatus.PENDING_APPROVAL);

        boolean conflict = meetingRepository.existsRoomConflict(meetingId, locationId, conflictStatuses, start, end);
        if (conflict) {
            throw new AppException(ErrorCode.MEETING_LOCATION_TIME_CONFLICT);
        }
    }

    /**
     * Kiểm tra quyền xem cuộc họp.
     */
    public void requireViewPermission(Meeting meeting) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN))
            return;

        User caller = currentUserService.getCurrentActiveUser();
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId()))
            return;

        // Cho phép nếu là Chủ trì (CHAIR) hoặc Thư ký (SECRETARY) của cuộc họp
        boolean isChairOrSecretary = meetingParticipantRepository
                .existsByMeetingIdAndUserIdAndParticipantRole(meeting.getId(), caller.getId(), ParticipantRole.CHAIR) ||
                meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(meeting.getId(),
                        caller.getId(), ParticipantRole.SECRETARY);
        if (isChairOrSecretary)
            return;

        // Cho phép nếu là Admin của đơn vị hoặc Lãnh đạo (Chủ tịch/Giám đốc) của đơn vị
        // quản lý cuộc họp
        if (meeting.getDepartment() != null && isLeaderOrAdminOfDepartment(caller, meeting.getDepartment().getId()))
            return;

        // Cho phép nếu caller là người phê duyệt hoặc người gửi yêu cầu phê duyệt trong
        // quy trình duyệt của cuộc họp này
        if (approvalService.isApproverOfResource(ResourceType.MEETING, meeting.getId(), caller))
            return;

        // Cho phép nếu là Người chuẩn bị tài liệu cho cuộc họp này (được gán ở
        // AgendaItem)
        boolean isPreparer = agendaItemRepository.existsByMeetingIdAndPreparedByUserId(meeting.getId(), caller.getId());
        if (isPreparer)
            return;

        // Cho phép đại biểu tham gia cuộc họp xem NHƯNG chỉ khi cuộc họp ĐÃ ĐƯỢC CÔNG
        // BỐ
        boolean isParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(meeting.getId(),
                caller.getId());
        if (isParticipant) {
            if (PUBLISHED_STATUSES.contains(meeting.getStatus())) {
                return;
            }
        }

        throw new AppException(ErrorCode.UNAUTHOZIZED);
    }

    /**
     * Kiểm tra quyền chỉnh sửa cuộc họp.
     */
    private void requireEditPermission(Meeting meeting) {
        if (!hasEditPermission(meeting, currentUserService.getCurrentActiveUser())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
    }

    private boolean hasEditPermission(Meeting meeting, User caller) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN))
            return true;
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId()))
            return true;

        return meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(meeting.getId(),
                caller.getId(), ParticipantRole.CHAIR) ||
                meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(meeting.getId(),
                        caller.getId(), ParticipantRole.SECRETARY);
    }

    private void populateResponseExtraFields(MeetingResponse resp, Meeting meeting, User caller) {
        resp.setCallerRole(determineCallerRole(meeting, caller));

        var participantOpt = meetingParticipantRepository.findByMeetingIdAndUserId(meeting.getId(), caller.getId());
        participantOpt.ifPresent(p -> resp.setCallerInviteStatus(p.getInviteStatus()));

        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meeting.getId());
        String chairs = participants.stream()
                .filter(p -> p.getParticipantRole() == ParticipantRole.CHAIR)
                .map(p -> p.getUser().getFullName())
                .collect(Collectors.joining(", "));
        resp.setChairName(chairs.isEmpty() ? null : chairs);

        // Phân quyền
        boolean isCreatorOrAdminOrChair = hasEditPermission(meeting, caller);
        boolean isCreatorOnly = meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId());
        
        List<AgendaItem> myItems = agendaItemRepository.findByPreparedByUserId(caller.getId()).stream()
                .filter(a -> a.getMeeting().getId().equals(meeting.getId()))
                .toList();
        boolean isPreparer = !myItems.isEmpty();

        String docPrepStatus = null;
        String docPrepRejectReason = null;
        int pending = 0;
        int submitted = 0;
        int rejected = 0;
        int approved = 0;

        if (isPreparer) {
            for (AgendaItem a : myItems) {
                if (a.getStatus() == AgendaItemStatus.REJECTED) {
                    rejected++;
                } else if (a.getStatus() == AgendaItemStatus.PENDING_PREPARATION || a.getStatus() == AgendaItemStatus.DRAFT) {
                    pending++;
                } else if (a.getStatus() == AgendaItemStatus.PENDING_APPROVAL) {
                    submitted++;
                } else {
                    approved++;
                }
            }

            if (rejected > 0) {
                docPrepStatus = "REJECTED";
                docPrepRejectReason = myItems.stream()
                        .filter(a -> a.getStatus() == AgendaItemStatus.REJECTED && a.getRejectReason() != null && !a.getRejectReason().trim().isEmpty())
                        .map(AgendaItem::getRejectReason)
                        .collect(Collectors.joining("; "));
            } else if (pending > 0) {
                docPrepStatus = "PENDING";
            } else if (submitted > 0) {
                docPrepStatus = "SUBMITTED";
            } else {
                docPrepStatus = "APPROVED";
            }
        }

        resp.setDocPreparationStatus(docPrepStatus);
        resp.setDocPreparationRejectReason(docPrepRejectReason);
        resp.setMyDocPendingCount(isPreparer ? pending : 0);
        resp.setMyDocSubmittedCount(isPreparer ? submitted : 0);
        resp.setMyDocRejectedCount(isPreparer ? rejected : 0);
        resp.setMyDocApprovedCount(isPreparer ? approved : 0);

        resp.setCanEdit(isCreatorOrAdminOrChair && CAN_EDIT_STATUSES.contains(meeting.getStatus()));
        resp.setCanCancel(isCreatorOnly && CAN_CANCEL_STATUSES.contains(meeting.getStatus()));
        resp.setCanPublish(isCreatorOnly && meeting.getStatus() == MeetingStatus.APPROVED);
        resp.setCanPostpone(false);
        resp.setCanDelete(isCreatorOnly && meeting.getStatus() == MeetingStatus.DRAFT);
        resp.setCanSubmitApproval(isCreatorOrAdminOrChair
                && (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED));
        resp.setCanUploadDocs(isPreparer
                && (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED)
                && !"APPROVED".equals(docPrepStatus)
                && !"SUBMITTED".equals(docPrepStatus));

        // Phê duyệt tài liệu: chỉ người tạo cuộc họp mới được phê duyệt
        if (isCreatorOnly) {
            int pendingCount = agendaItemRepository.countByMeetingIdAndStatus(meeting.getId(),
                    AgendaItemStatus.PENDING_APPROVAL);
            resp.setCanApproveDocs(pendingCount > 0);
            resp.setPendingApprovalCount(pendingCount);
        } else {
            resp.setCanApproveDocs(false);
            resp.setPendingApprovalCount(0);
        }

        boolean canApprove = approvalService.hasApprovePermission(ResourceType.MEETING, meeting.getId());
        resp.setCanApprove(canApprove);

        // Điểm danh
        resp.setCallerAttendanceStatus(participantOpt.map(MeetingParticipant::getAttendanceStatus).orElse(null));
        boolean isCreator = meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId());
        boolean isChairOrSecretary = participants.stream()
                .anyMatch(p -> p.getUser() != null && p.getUser().getId().equals(caller.getId()) &&
                        (p.getParticipantRole() == ParticipantRole.CHAIR || p.getParticipantRole() == ParticipantRole.SECRETARY));
        boolean isDeptAdmin = currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN);
        boolean isSuperAdmin = currentUserService.hasRole(RoleName.SUPER_ADMIN);

        if (isCreator || isChairOrSecretary || isDeptAdmin || isSuperAdmin) {
            List<String> uncheckedInNames = participants.stream()
                    .filter(p -> p.getAttendanceStatus() == AttendanceStatus.NOT_CHECKED_IN 
                            && p.getInviteStatus() == InviteStatus.ACCEPTED
                            && p.getUser() != null)
                    .map(p -> p.getUser().getFullName())
                    .toList();
            resp.setPendingAttendanceParticipants(uncheckedInNames);
        } else {
            resp.setPendingAttendanceParticipants(null);
        }
    }

    private boolean hasEditPermissionOptimized(Meeting meeting, User caller, List<MeetingParticipant> participants) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN))
            return true;
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId()))
            return true;

        return participants.stream().anyMatch(p -> p.getUser() != null && p.getUser().getId().equals(caller.getId()) &&
                (p.getParticipantRole() == ParticipantRole.CHAIR
                        || p.getParticipantRole() == ParticipantRole.SECRETARY));
    }

    private String determineCallerRoleOptimized(Meeting meeting, User caller, List<MeetingParticipant> participants,
            boolean isPreparer) {
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId())) {
            return "CREATOR";
        }

        var participantOpt = participants.stream()
                .filter(p -> p.getUser() != null && p.getUser().getId().equals(caller.getId()))
                .findFirst();
        if (participantOpt.isPresent()) {
            ParticipantRole role = participantOpt.get().getParticipantRole();
            if (role != null) {
                return role.name();
            }
        }

        if (isPreparer) {
            return "PREPARER";
        }

        return "VIEWER";
    }

    private void populateResponseExtraFieldsOptimized(
            MeetingResponse resp,
            Meeting meeting,
            User caller,
            List<MeetingParticipant> participants,
            boolean isPreparer) {

        boolean isSaved = savedMeetingRepository.existsByUserIdAndMeetingId(caller.getId(), meeting.getId());
        resp.setIsSaved(isSaved);

        resp.setCallerRole(determineCallerRoleOptimized(meeting, caller, participants, isPreparer));

        var participantOpt = participants.stream()
                .filter(p -> p.getUser() != null && p.getUser().getId().equals(caller.getId()))
                .findFirst();
        participantOpt.ifPresent(p -> resp.setCallerInviteStatus(p.getInviteStatus()));

        String chairs = participants.stream()
                .filter(p -> p.getParticipantRole() == ParticipantRole.CHAIR)
                .map(p -> p.getUser().getFullName())
                .collect(Collectors.joining(", "));
        resp.setChairName(chairs.isEmpty() ? null : chairs);

        List<String> pendingList = participants.stream()
                .filter(p -> p.getInviteStatus() == InviteStatus.PENDING && p.getUser() != null)
                .map(p -> p.getUser().getFullName())
                .toList();
        resp.setPendingParticipants(pendingList);

        // Phân quyền
        boolean isCreatorOrAdminOrChair = hasEditPermissionOptimized(meeting, caller, participants);
        boolean isCreatorOnly = meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId());

        resp.setCanEdit(isCreatorOrAdminOrChair && CAN_EDIT_STATUSES.contains(meeting.getStatus()));
        resp.setCanCancel(isCreatorOnly && CAN_CANCEL_STATUSES.contains(meeting.getStatus()));
        resp.setCanPublish(isCreatorOnly && meeting.getStatus() == MeetingStatus.APPROVED);
        resp.setCanPostpone(false);
        resp.setCanDelete(isCreatorOnly && meeting.getStatus() == MeetingStatus.DRAFT);
        resp.setCanSubmitApproval(isCreatorOrAdminOrChair
                && (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED));
        resp.setCanUploadDocs(isPreparer
                && (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED));

        // Phê duyệt tài liệu: chỉ người tạo cuộc họp mới được phê duyệt
        if (isCreatorOnly) {
            int pendingCount = agendaItemRepository.countByMeetingIdAndStatus(meeting.getId(),
                    AgendaItemStatus.PENDING_APPROVAL);
            resp.setCanApproveDocs(pendingCount > 0);
            resp.setPendingApprovalCount(pendingCount);
        } else {
            resp.setCanApproveDocs(false);
            resp.setPendingApprovalCount(0);
        }

        boolean canApprove = approvalService.hasApprovePermission(ResourceType.MEETING, meeting.getId());
        resp.setCanApprove(canApprove);

        // Điểm danh
        resp.setCallerAttendanceStatus(participantOpt.map(MeetingParticipant::getAttendanceStatus).orElse(null));
        boolean isCreator = meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId());
        boolean isChairOrSecretary = participants.stream()
                .anyMatch(p -> p.getUser() != null && p.getUser().getId().equals(caller.getId()) &&
                        (p.getParticipantRole() == ParticipantRole.CHAIR || p.getParticipantRole() == ParticipantRole.SECRETARY));
        boolean isDeptAdmin = currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN);
        boolean isSuperAdmin = currentUserService.hasRole(RoleName.SUPER_ADMIN);

        if (isCreator || isChairOrSecretary || isDeptAdmin || isSuperAdmin) {
            List<String> uncheckedInNames = participants.stream()
                    .filter(p -> p.getAttendanceStatus() == AttendanceStatus.NOT_CHECKED_IN 
                            && p.getInviteStatus() == InviteStatus.ACCEPTED
                            && p.getUser() != null)
                    .map(p -> p.getUser().getFullName())
                    .toList();
            resp.setPendingAttendanceParticipants(uncheckedInNames);
        } else {
            resp.setPendingAttendanceParticipants(null);
        }
    }

    private Map<String, Object> resolveInvitationTemplateAndReplacements(UUID meetingId,
            MeetingInvitationPreviewRequest request) {
        Meeting meeting = getMeeting(meetingId);

        DocTemplate template;
        if (request.getInvitationTemplateId() != null) {
            template = docTemplateRepository.findById(request.getInvitationTemplateId())
                    .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));
        } else {
            template = docTemplateRepository.findFirstBy()
                    .orElseThrow(() -> new AppException(ErrorCode.TEMPLATE_NOT_FOUND));
        }

        // Parse contentJson
        Map<String, Object> templateData;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            templateData = mapper.readValue(template.getContentJson(),
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                    });
        } catch (Exception e) {
            log.error("Failed to parse template contentJson", e);
            throw new AppException(ErrorCode.TEMPLATE_NOT_FOUND);
        }

        // Build replacements map
        Map<String, String> replacements = new java.util.HashMap<>();

        // 1. Meeting context
        replacements.put("meetingName", meeting.getTitle() != null ? meeting.getTitle() : "");

        String timeStr = "[Thời gian cuộc họp]";
        if (meeting.getStartTime() != null) {
            try {
                timeStr = String.format("vào lúc %02d giờ %02d phút, ngày %02d tháng %02d năm %d",
                        meeting.getStartTime().getHour(),
                        meeting.getStartTime().getMinute(),
                        meeting.getStartTime().getDayOfMonth(),
                        meeting.getStartTime().getMonthValue(),
                        meeting.getStartTime().getYear());
            } catch (Exception e) {
                // Ignore
            }
        }
        replacements.put("meetingTime", timeStr);
        replacements.put("meetingLocation",
                meeting.getLocation() != null ? meeting.getLocation().getName() : "[Địa điểm cuộc họp]");

        // Cần đảm bảo meetingContent được lấy từ meeting.content (chương trình họp ở
        // Bước 1)
        replacements.put("meetingContent",
                meeting.getContent() != null ? meeting.getContent() : "Xem tài liệu chương trình kèm theo");

        // invitationContent là nội dung thư mời do người dùng tự nhập ở Bước 3
        replacements.put("invitationContent",
                request.getInvitationContent() != null ? request.getInvitationContent() : "");

        // Org name & Dept name
        String orgName = "ỦY BAN NHÂN DÂN THÀNH PHỐ HẢI PHÒNG";
        String deptName = "PHÒNG NỘI VỤ";
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getDepartment() != null) {
            Department dept = meeting.getCreatedBy().getDepartment();
            deptName = dept.getDeptName();
            if (dept.getParentDepartment() != null && dept.getParentDepartment().getDeptName() != null) {
                orgName = dept.getParentDepartment().getDeptName();
            } else {
                orgName = deptName;
            }
        }
        replacements.put("organizationName", orgName);
        replacements.put("departmentName", deptName);
        replacements.put("locationName", "Hải Phòng");

        // Signer info: Lấy người có chức vụ cao nhất của đơn vị (cấp Sở/Ban/Ngành hoặc
        // đơn vị trực thuộc Root) của người tạo phiên họp
        String signerName = "Nguyễn Văn B";
        String signerPosition = "CHỦ TỊCH HỘI ĐỒNG";

        if (meeting.getCreatedBy() != null) {
            User creator = meeting.getCreatedBy();
            Department creatorDept = creator.getDepartment();
            if (creatorDept != null) {
                // Đi lên cấp đơn vị cao nhất (Level 1 trực thuộc root, hoặc bản thân nếu đã là
                // root)
                Department unitDept = creatorDept;
                while (unitDept.getParentDepartment() != null
                        && unitDept.getParentDepartment().getParentDepartment() != null) {
                    unitDept = unitDept.getParentDepartment();
                }

                List<User> deptUsers = userRepository.findByDepartmentIdAndStatus(unitDept.getId(), UserStatus.ACTIVE);
                if (deptUsers != null && !deptUsers.isEmpty()) {
                    User topUser = deptUsers.stream()
                            .filter(u -> u.getPosition() != null)
                            .min(java.util.Comparator.comparing(u -> {
                                Integer rank = u.getPosition().getRankOrder();
                                return rank != null ? rank : Integer.MAX_VALUE;
                            }))
                            .orElse(null);
                    if (topUser != null) {
                        signerName = topUser.getFullName() != null ? topUser.getFullName() : "";
                        signerPosition = topUser.getPosition().getPositionName() != null
                                ? topUser.getPosition().getPositionName()
                                : "";
                    } else {
                        signerName = creator.getFullName() != null ? creator.getFullName() : "";
                        if (creator.getPosition() != null) {
                            signerPosition = creator.getPosition().getPositionName() != null
                                    ? creator.getPosition().getPositionName()
                                    : "";
                        }
                    }
                } else {
                    signerName = creator.getFullName() != null ? creator.getFullName() : "";
                    if (creator.getPosition() != null) {
                        signerPosition = creator.getPosition().getPositionName() != null
                                ? creator.getPosition().getPositionName()
                                : "";
                    }
                }
            } else {
                signerName = creator.getFullName() != null ? creator.getFullName() : "";
                if (creator.getPosition() != null) {
                    signerPosition = creator.getPosition().getPositionName() != null
                            ? creator.getPosition().getPositionName()
                            : "";
                }
            }
        }
        replacements.put("signerName", signerName);
        replacements.put("signerPosition", signerPosition);
        replacements.put("docNumber", ".... /GM-UBND");

        // Date info (using current date)
        LocalDateTime now = LocalDateTime.now();
        replacements.put("day", String.format("%02d", now.getDayOfMonth()));
        replacements.put("month", String.format("%02d", now.getMonthValue()));
        replacements.put("year", String.valueOf(now.getYear()));

        // 2. Invitee context
        String receiverName = "[Tên đại biểu]";
        String receiverPosition = "[Chức vụ]";
        String receiverDepartment = "[Đơn vị]";

        if (request.getInviteeId() != null) {
            if ("USER".equalsIgnoreCase(request.getInviteeType())) {
                User user = userRepository.findById(request.getInviteeId()).orElse(null);
                if (user != null) {
                    receiverName = user.getFullName() != null ? user.getFullName() : "";
                    receiverPosition = user.getPosition() != null ? user.getPosition().getPositionName() : "";
                    receiverDepartment = user.getDepartment() != null ? user.getDepartment().getDeptName() : "";
                }
            } else if ("GUEST".equalsIgnoreCase(request.getInviteeType())) {
                MeetingGuest guest = meetingGuestRepository.findById(request.getInviteeId()).orElse(null);
                if (guest != null) {
                    receiverName = guest.getFullName() != null ? guest.getFullName() : "";
                    receiverPosition = guest.getPosition() != null ? guest.getPosition() : "";
                    receiverDepartment = guest.getCompany() != null ? guest.getCompany() : "";
                }
            }
        } else {
            // Fallback to the first attendee of the meeting
            List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
            if (!participants.isEmpty()) {
                User user = participants.get(0).getUser();
                if (user != null) {
                    receiverName = user.getFullName() != null ? user.getFullName() : "";
                    receiverPosition = user.getPosition() != null ? user.getPosition().getPositionName() : "";
                    receiverDepartment = user.getDepartment() != null ? user.getDepartment().getDeptName() : "";
                }
            } else {
                List<MeetingGuest> guests = meetingGuestRepository.findByMeetingId(meetingId);
                if (!guests.isEmpty()) {
                    MeetingGuest guest = guests.get(0);
                    receiverName = guest.getFullName() != null ? guest.getFullName() : "";
                    receiverPosition = guest.getPosition() != null ? guest.getPosition() : "";
                    receiverDepartment = guest.getCompany() != null ? guest.getCompany() : "";
                }
            }
        }

        replacements.put("receiverName", receiverName);
        replacements.put("receiverPosition", receiverPosition);
        replacements.put("receiverDepartment", receiverDepartment);

        Map<String, Object> resolved = new java.util.HashMap<>();
        resolved.put("templateData", templateData);
        resolved.put("replacements", replacements);
        return resolved;
    }

    @Transactional(readOnly = true)
    public MeetingInvitationPreviewResponse previewInvitation(UUID meetingId, MeetingInvitationPreviewRequest request) {
        Map<String, Object> resolved = resolveInvitationTemplateAndReplacements(meetingId, request);
        Map<String, Object> templateData = (Map<String, Object>) resolved.get("templateData");
        Map<String, String> replacements = (Map<String, String>) resolved.get("replacements");

        // Compile fields
        return MeetingInvitationPreviewResponse.builder()
                .headerTrai(
                        invitationPdfService.compileSingleString((String) templateData.get("headerTrai"), replacements))
                .headerPhai(
                        invitationPdfService.compileSingleString((String) templateData.get("headerPhai"), replacements))
                .ngayThang(
                        invitationPdfService.compileSingleString((String) templateData.get("ngayThang"), replacements))
                .tieuDe(invitationPdfService.compileSingleString((String) templateData.get("tieuDe"), replacements))
                .trichYeu(invitationPdfService.compileSingleString((String) templateData.get("trichYeu"), replacements))
                .noiDung(invitationPdfService.compileSingleString((String) templateData.get("noiDung"), replacements))
                .chuKy(invitationPdfService.compileSingleString((String) templateData.get("chuKy"), replacements))
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportInvitationPdf(UUID meetingId, MeetingInvitationPreviewRequest request) {
        Map<String, Object> resolved = resolveInvitationTemplateAndReplacements(meetingId, request);
        Map<String, Object> templateData = (Map<String, Object>) resolved.get("templateData");
        Map<String, String> replacements = (Map<String, String>) resolved.get("replacements");

        return invitationPdfService.generatePdf(templateData, replacements);
    }
}
