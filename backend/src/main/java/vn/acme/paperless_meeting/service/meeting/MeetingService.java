package vn.acme.paperless_meeting.service.meeting;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
import vn.acme.paperless_meeting.dto.request.meeting.MeetingUpsertRequest;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingPostponeRequest;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.meeting.MeetingMapper;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.LocationRepository;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.repository.RoleRepository;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.enums.PositionCode;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.service.approval.ApprovalService;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.specification.meeting.MeetingSpecification;

import org.springframework.context.annotation.Lazy;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.service.speaker.SpeakerService;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingService {

    // SpeakerService inject riêng bằng setter để tránh circular dependency
    @lombok.experimental.NonFinal
    private SpeakerService speakerService;

    @org.springframework.beans.factory.annotation.Autowired
    public void setSpeakerService(@Lazy SpeakerService speakerService) {
        this.speakerService = speakerService;
    }

    // MotionService inject riêng bằng setter để tránh circular dependency
    @lombok.experimental.NonFinal
    private vn.acme.paperless_meeting.service.motion.MotionService motionService;

    @org.springframework.beans.factory.annotation.Autowired
    public void setMotionService(@Lazy vn.acme.paperless_meeting.service.motion.MotionService motionService) {
        this.motionService = motionService;
    }

    MeetingRepository meetingRepository;
    MeetingMapper meetingMapper;
    CurrentUserService currentUserService;
    DepartmentRepository departmentRepository;
    DepartmentService departmentService;
    LocationRepository locationRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    AgendaItemRepository agendaItemRepository;
    ApprovalService approvalService;
    AuditLogPublisher auditLogPublisher;
    UserRepository userRepository;
    RoleRepository roleRepository;

    static final java.util.Set<MeetingStatus> PUBLISHED_STATUSES = java.util.Set.of(
        MeetingStatus.UPCOMING, MeetingStatus.IN_PROGRESS, MeetingStatus.CLOSED, MeetingStatus.CANCELLED, MeetingStatus.EXPIRED
    );
    
    static final java.util.Set<MeetingStatus> CAN_CANCEL_STATUSES = java.util.Set.of(
        MeetingStatus.PENDING_APPROVAL, MeetingStatus.APPROVED, MeetingStatus.UPCOMING
    );
    
    static final java.util.Set<MeetingStatus> CAN_EDIT_STATUSES = java.util.Set.of(
        MeetingStatus.DRAFT, MeetingStatus.REJECTED, MeetingStatus.PENDING_APPROVAL, MeetingStatus.APPROVED, MeetingStatus.UPCOMING
    );

    private boolean isLeader(User user) {
        if (user == null || user.getPosition() == null) return false;
        String posCode = user.getPosition().getPositionCode();
        return PositionCode.CHU_TICH.getCode().equals(posCode) || 
               PositionCode.GIAM_DOC.getCode().equals(posCode);
    }

    private boolean isLeaderOrAdminOfDepartment(User user, UUID targetDeptId) {
        if (user == null || targetDeptId == null) return false;
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) return true;
        
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
        if (locationId == null) return null;
        return locationRepository.findById(locationId)
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_EXIST));
    }

    /**
     * Tìm kiếm và phân trang danh sách cuộc họp theo bộ lọc (từ khóa, trạng thái, thời gian).
     */
    @Transactional(readOnly = true)
    public PageResponse<MeetingResponse> findAll(String keyword, List<MeetingStatus> statuses, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        User caller = currentUserService.getCurrentActiveUser();
        boolean isSuperAdmin = currentUserService.hasRole(RoleName.SUPER_ADMIN);
        
        List<UUID> allowedDeptIds = null;
        if (!isSuperAdmin && (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) || isLeader(caller)) && caller.getDepartment() != null) {
            allowedDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
        }

        Specification<Meeting> spec = MeetingSpecification.build(keyword, null, statuses, fromDate, toDate, allowedDeptIds, caller.getId(), isSuperAdmin, false);
        Page<Meeting> page = meetingRepository.findAll(spec, pageable);

        List<MeetingResponse> content = page.getContent().stream()
                .map(meeting -> {
                    MeetingResponse resp = meetingMapper.toResponse(meeting);
                    populateResponseExtraFields(resp, meeting, caller);
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
    public List<MeetingResponse> findCalendarMeetings(LocalDateTime fromDate, LocalDateTime toDate, List<MeetingStatus> statuses, Boolean onlyMyMeetings) {
        User caller = currentUserService.getCurrentActiveUser();
        boolean isSuperAdmin = currentUserService.hasRole(RoleName.SUPER_ADMIN);
        
        List<UUID> allowedDeptIds = null;
        if (!isSuperAdmin && (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) || isLeader(caller)) && caller.getDepartment() != null) {
            allowedDeptIds = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
        }

        Specification<Meeting> spec = MeetingSpecification.build(null, null, statuses, fromDate, toDate, allowedDeptIds, caller.getId(), isSuperAdmin, onlyMyMeetings);
        List<Meeting> meetings = meetingRepository.findAll(spec);

        return meetings.stream()
                .map(meeting -> {
                    MeetingResponse resp = meetingMapper.toResponse(meeting);
                    populateResponseExtraFields(resp, meeting, caller);
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
     * Tạo cuộc họp mới ở trạng thái NHÁP. Kiểm tra phân quyền, thời gian và phòng họp.
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

        auditLogPublisher.publish(caller, AuditAction.CREATE_MEETING, ResourceType.MEETING, savedMeeting.getId(), Map.of("title", String.valueOf(savedMeeting.getTitle())));

        MeetingResponse resp = meetingMapper.toResponse(savedMeeting);
        populateResponseExtraFields(resp, savedMeeting, caller);
        return resp;
    }

    /**
     * Cập nhật thông tin cuộc họp. Chỉ cho phép chỉnh sửa khi ở trạng thái NHÁP hoặc BỊ TỪ CHỐI.
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
        
        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.UPDATE_MEETING, ResourceType.MEETING, savedMeeting.getId(), Map.of("title", String.valueOf(savedMeeting.getTitle())));

        MeetingResponse resp = meetingMapper.toResponse(savedMeeting);
        populateResponseExtraFields(resp, savedMeeting, currentUserService.getCurrentActiveUser());
        return resp;
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

        long secretaryCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(id, ParticipantRole.SECRETARY);
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

        if (meeting.getStartTime() == null || meeting.getStartTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES);
        }

        meeting.setStatus(MeetingStatus.UPCOMING);
        meetingRepository.save(meeting);
    }

    /**
     * Hoãn cuộc họp. Cập nhật thời gian mới và lý do hoãn. Chỉ người tạo mới thực hiện được.
     */
    @Transactional
    public MeetingResponse postpone(UUID id, MeetingPostponeRequest request) {
        Meeting meeting = getMeeting(id);
        User caller = currentUserService.getCurrentActiveUser();

        // Chỉ người tạo mới được hoãn
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        // Chỉ cho phép hoãn cuộc họp APPROVED hoặc UPCOMING
        if (meeting.getStatus() != MeetingStatus.APPROVED && meeting.getStatus() != MeetingStatus.UPCOMING) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        // Validate thời gian mới
        LocalDateTime start = request.getNewStartTime();
        LocalDateTime end = request.getNewEndTime();
        if (start == null || end == null || !end.isAfter(start)) {
            throw new AppException(ErrorCode.MEETING_INVALID_TIME_RANGE);
        }
        if (start.isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new AppException(ErrorCode.MEETING_MUST_BE_SCHEDULED_BEFORE_30_MINUTES);
        }

        // Validate location conflict
        UUID locationId = meeting.getLocation() != null ? meeting.getLocation().getId() : null;
        validateLocationConflict(id, locationId, start, end);

        // Cập nhật thông tin
        meeting.setStartTime(start);
        meeting.setEndTime(end);

        // Tự động dịch deadline RSVP nếu nó đang muộn hơn start time mới
        if (meeting.getRsvpDeadline() != null && meeting.getRsvpDeadline().isAfter(start)) {
            meeting.setRsvpDeadline(start);
        }

        // Lưu lý do hoãn
        if (request.getReason() != null && !request.getReason().trim().isEmpty()) {
            String currentContent = meeting.getContent() != null ? meeting.getContent() : "";
            meeting.setContent(currentContent + "\n[Hoãn cuộc họp]: " + request.getReason());
        }

        Meeting savedMeeting = meetingRepository.save(meeting);

        auditLogPublisher.publish(caller, AuditAction.UPDATE_MEETING, ResourceType.MEETING, savedMeeting.getId(), 
            Map.of("title", String.valueOf(savedMeeting.getTitle()), "action", "POSTPONE", "reason", String.valueOf(request.getReason())));

        MeetingResponse resp = meetingMapper.toResponse(savedMeeting);
        populateResponseExtraFields(resp, savedMeeting, caller);
        return resp;
    }

    /**
     * Từ chối phê duyệt cuộc họp kèm theo lý do. Chuyển trạng thái sang BỊ TỪ CHỐI.
     */
    @Transactional
    public void reject(UUID id, String rejectReason) {
        approvalService.rejectResource(ResourceType.MEETING, id, rejectReason);
    }

    /**
     * Hủy cuộc họp sắp diễn ra hoặc đang chờ duyệt kèm lý do. Chuyển trạng thái sang ĐÃ HỦY.
     */
    @Transactional
    public void cancel(UUID id, String cancelReason) {
        Meeting meeting = getMeeting(id);
        User caller = currentUserService.getCurrentActiveUser();
        if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        if (meeting.getStatus() != MeetingStatus.UPCOMING 
            && meeting.getStatus() != MeetingStatus.PENDING_APPROVAL 
            && meeting.getStatus() != MeetingStatus.APPROVED) {
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

        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.CANCEL_MEETING, ResourceType.MEETING, meeting.getId(), Map.of("title", String.valueOf(meeting.getTitle()), "cancelReason", cancelReason));
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

        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.CLOSE_MEETING, ResourceType.MEETING, meeting.getId(), Map.of("title", String.valueOf(meeting.getTitle())));
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
        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.DELETE_MEETING, ResourceType.MEETING, meeting.getId(), Map.of("title", String.valueOf(meeting.getTitle())));
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
        auditLogPublisher.publish(currentUserService.getCurrentActiveUser(), AuditAction.UPDATE_MEETING, ResourceType.MEETING, meeting.getId(), Map.of("title", String.valueOf(meeting.getTitle()), "action", "RESTORE"));
    }

    /**
     * Tìm cuộc họp theo ID. Ném ngoại lệ nếu không tồn tại.
     */
    private Meeting getMeeting(UUID id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    /**
     * Xác thực thời gian họp (phải lên lịch trước ít nhất 30 phút, kết thúc sau bắt đầu).
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
        if (locationId == null) return;
        
        // Chỉ kiểm tra trùng lịch với cuộc họp có hiệu lực (APPROVED, UPCOMING, IN_PROGRESS, PENDING_APPROVAL)
        List<MeetingStatus> conflictStatuses = List.of(
            MeetingStatus.APPROVED,
            MeetingStatus.UPCOMING, 
            MeetingStatus.IN_PROGRESS, 
            MeetingStatus.PENDING_APPROVAL
        );

        boolean conflict = meetingRepository.existsRoomConflict(meetingId, locationId, conflictStatuses, start, end);
        if (conflict) {
            throw new AppException(ErrorCode.MEETING_LOCATION_TIME_CONFLICT);
        }
    }

    /**
     * Kiểm tra quyền xem cuộc họp.
     */
    private void requireViewPermission(Meeting meeting) {
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) return;
        
        User caller = currentUserService.getCurrentActiveUser();
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId())) return;
        
        // Cho phép nếu là Admin của đơn vị hoặc Lãnh đạo (Chủ tịch/Giám đốc) của đơn vị quản lý cuộc họp
        if (meeting.getDepartment() != null && isLeaderOrAdminOfDepartment(caller, meeting.getDepartment().getId())) return;

        // Cho phép nếu là Người chuẩn bị tài liệu cho cuộc họp này (được gán ở AgendaItem)
        boolean isPreparer = agendaItemRepository.existsByMeetingIdAndPreparedByUserId(meeting.getId(), caller.getId());
        if (isPreparer) return;

        // Cho phép đại biểu tham gia cuộc họp xem NHƯNG chỉ khi cuộc họp ĐÃ ĐƯỢC CÔNG BỐ
        boolean isParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(meeting.getId(), caller.getId());
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
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) return true;
        if (meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId())) return true;
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN) && meeting.getDepartment() != null && caller.getDepartment() != null) {
            List<UUID> subDepts = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId());
            if (subDepts.contains(meeting.getDepartment().getId())) return true;
        }
        return meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
            meeting.getId(), caller.getId(), ParticipantRole.CHAIR);
    }

    private void populateResponseExtraFields(MeetingResponse resp, Meeting meeting, User caller) {
        resp.setCallerRole(determineCallerRole(meeting, caller));
        
        var participantOpt = meetingParticipantRepository.findByMeetingIdAndUserId(meeting.getId(), caller.getId());
        participantOpt.ifPresent(p -> resp.setCallerInviteStatus(p.getInviteStatus()));
        
        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meeting.getId());
        String chairs = participants.stream()
                .filter(p -> p.getParticipantRole() == ParticipantRole.CHAIR)
                .map(p -> p.getUser().getFullName())
                .collect(java.util.stream.Collectors.joining(", "));
        resp.setChairName(chairs.isEmpty() ? null : chairs);

        // Phân quyền
        boolean isCreatorOrAdminOrChair = hasEditPermission(meeting, caller);
        boolean isCreatorOnly = meeting.getCreatedBy() != null && meeting.getCreatedBy().getId().equals(caller.getId());
        boolean isPreparer = agendaItemRepository.existsByMeetingIdAndPreparedByUserId(meeting.getId(), caller.getId());

        resp.setCanEdit(isCreatorOrAdminOrChair && CAN_EDIT_STATUSES.contains(meeting.getStatus()));
        resp.setCanCancel(isCreatorOnly && CAN_CANCEL_STATUSES.contains(meeting.getStatus()));
        resp.setCanPublish(isCreatorOnly && meeting.getStatus() == MeetingStatus.APPROVED);
        resp.setCanPostpone(isCreatorOnly && CAN_CANCEL_STATUSES.contains(meeting.getStatus()));
        resp.setCanDelete(isCreatorOnly && meeting.getStatus() == MeetingStatus.DRAFT);
        resp.setCanSubmitApproval(isCreatorOrAdminOrChair && (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED));
        resp.setCanUploadDocs(isPreparer && (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED));

        boolean canApprove = false;
        if (meeting.getStatus() == MeetingStatus.PENDING_APPROVAL) {
            if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
                canApprove = true;
            } else if (meeting.getDepartment() != null && isLeader(caller) && caller.getDepartment() != null) {
                canApprove = departmentService.getAllSubDepartmentIds(caller.getDepartment().getId()).contains(meeting.getDepartment().getId());
            }
        }
        resp.setCanApprove(canApprove);
    }
}
