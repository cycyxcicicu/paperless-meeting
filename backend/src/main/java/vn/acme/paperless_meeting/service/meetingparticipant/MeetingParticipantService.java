package vn.acme.paperless_meeting.service.meetingparticipant;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddAttendeesRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddGuestRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddParticipantRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.SendInvitationsRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateAttendanceStatusRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateInviteStatusRequest;
import vn.acme.paperless_meeting.dto.request.opinion.OpinionRequest;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemResponse;
import vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.dto.response.meeting.PublicMeetingInviteResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeStatisticsResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.GuestResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.MeetingAttendeesResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.ParticipantResponse;
import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.dto.response.motion.VoteStatisticsResponse;
import vn.acme.paperless_meeting.dto.response.opinion.OpinionResponse;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerQueueResponse;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.AttendanceLog;
import vn.acme.paperless_meeting.entity.DocumentVersion;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.MeetingInvitation;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.Notification;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ChannelType;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.NotificationStatus;
import vn.acme.paperless_meeting.entity.enums.NotificationType;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.SendStatus;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.meeting.MeetingMapper;
import vn.acme.paperless_meeting.mapper.meetingparticipant.MeetingGuestMapper;
import vn.acme.paperless_meeting.mapper.meetingparticipant.MeetingParticipantMapper;
import vn.acme.paperless_meeting.mapper.user.UserMapper;
import vn.acme.paperless_meeting.repository.AttendanceLogRepository;
import vn.acme.paperless_meeting.repository.DepartmentRepository;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MeetingInvitationRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.NotificationRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.repository.VoteEligibilityRepository;
import vn.acme.paperless_meeting.service.agenda.AgendaItemService;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.document.DocumentService;
import vn.acme.paperless_meeting.service.email.InvitationMailService;
import vn.acme.paperless_meeting.service.email.MailTemplateService;
import vn.acme.paperless_meeting.service.motion.MotionService;
import vn.acme.paperless_meeting.service.opinion.OpinionService;
import vn.acme.paperless_meeting.service.speaker.SpeakerService;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingParticipantService {

    MeetingParticipantRepository meetingParticipantRepository;
    MeetingGuestRepository meetingGuestRepository;
    MeetingRepository meetingRepository;
    UserRepository userRepository;
    DepartmentRepository departmentRepository;
    AttendanceLogRepository attendanceLogRepository;
    MeetingParticipantMapper meetingParticipantMapper;
    MeetingGuestMapper meetingGuestMapper;
    MeetingMapper meetingMapper;
    CurrentUserService currentUserService;
    AuditLogPublisher auditLogPublisher;
    VoteEligibilityRepository voteEligibilityRepository;
    DocumentService documentService;
    MeetingInvitationRepository meetingInvitationRepository;
    NotificationRepository notificationRepository;
    InvitationMailService invitationMailService;
    MailTemplateService mailTemplateService;
    AgendaItemService agendaItemService;
    SpeakerService speakerService;
    MotionService motionService;
    OpinionService opinionService;
    UserMapper userMapper;
    WebSocketNotificationService webSocketNotificationService;

    @Value("${app.urls.frontend}")
    @lombok.experimental.NonFinal
    String frontendUrl;

    @Value("${app.urls.backend}")
    @lombok.experimental.NonFinal
    String backendUrl;

    static final List<MeetingStatus> ACTIVE_MEETING_STATUSES = List.of(MeetingStatus.APPROVED, MeetingStatus.UPCOMING,
            MeetingStatus.IN_PROGRESS);

    private Meeting getMeeting(UUID meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    private Integer calculateLateMinutes(Meeting meeting, LocalDateTime checkinTime) {
        LocalDateTime lateLimit = meeting.getStartTime().plusMinutes(
                meeting.getLateAfterMinutes() != null ? meeting.getLateAfterMinutes() : 0);
        if (checkinTime.isAfter(lateLimit)) {
            return (int) Duration.between(meeting.getStartTime(), checkinTime).toMinutes();
        }
        return null;
    }

    private void requireEditPermission(Meeting meeting) {
        User caller = currentUserService.getCurrentActiveUser();
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN))
            return;
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)
                && caller.getDepartment() != null
                && caller.getDepartment().getId().equals(meeting.getDepartment().getId()))
            return;
        if (meeting.getCreatedBy().getId().equals(caller.getId()))
            return;
        throw new AppException(ErrorCode.MEETING_PARTICIPANT_MANAGEMENT_FORBIDDEN);
    }

    private void requireAttendancePermission(Meeting meeting) {
        User caller = currentUserService.getCurrentActiveUser();
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN))
            return;
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)
                && caller.getDepartment() != null
                && caller.getDepartment().getId().equals(meeting.getDepartment().getId()))
            return;
        if (meeting.getCreatedBy().getId().equals(caller.getId()))
            return;

        boolean isSecretaryOrChair = meetingParticipantRepository
                .findByMeetingIdAndUserId(meeting.getId(), caller.getId())
                .map(p -> p.getParticipantRole() == ParticipantRole.SECRETARY
                        || p.getParticipantRole() == ParticipantRole.CHAIR)
                .orElse(false);
        if (isSecretaryOrChair)
            return;

        throw new AppException(ErrorCode.MEETING_PARTICIPANT_MANAGEMENT_FORBIDDEN);
    }

    private void validateMeetingStateForParticipantMod(Meeting meeting) {
        if (meeting.getStatus() == MeetingStatus.CLOSED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED);
        }
        if (meeting.getStatus() == MeetingStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_EDITABLE);
        }
    }

    private void validateMeetingStateForRsvp(Meeting meeting) {
        if (meeting.getStatus() == MeetingStatus.CLOSED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED);
        }
        if (meeting.getStatus() == MeetingStatus.DRAFT
                || meeting.getStatus() == MeetingStatus.REJECTED
                || meeting.getStatus() == MeetingStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }
        if (meeting.getRsvpDeadline() != null
                && LocalDateTime.now().isAfter(meeting.getRsvpDeadline())
                && meeting.getStatus() == MeetingStatus.APPROVED) {
            throw new AppException(ErrorCode.MEETING_RSVP_DEADLINE_EXPIRED);
        }
    }

    @Transactional
    public MeetingAttendeesResponse addAttendees(UUID meetingId, AddAttendeesRequest request) {
        Meeting meeting = getMeeting(meetingId);

        // Validate location capacity
        Location location = meeting.getLocation();
        if (location != null && location.getCapacity() != null && location.getCapacity() > 0) {
            int totalProposed = 0;
            if (request.getParticipants() != null) {
                totalProposed += request.getParticipants().size();
            }
            if (request.getGuests() != null) {
                totalProposed += request.getGuests().size();
            }
            if (totalProposed > location.getCapacity()) {
                throw new AppException(ErrorCode.MEETING_LOCATION_CAPACITY_EXCEEDED);
            }
        }

        if (request.getParticipants() != null && !request.getParticipants().isEmpty()) {
            addParticipants(meetingId, request.getParticipants());
        }
        if (request.getGuests() != null && !request.getGuests().isEmpty()) {
            addExternalGuests(meetingId, request.getGuests());
        }
        return getAttendees(meetingId);
    }

    @Transactional
    public List<ParticipantResponse> addParticipants(UUID meetingId, List<AddParticipantRequest> requests) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);
        validateMeetingStateForParticipantMod(meeting);

        // RÀNG BUỘC PARTICIPANT-01: Kiểm tra trùng lặp userId trong danh sách đại biểu
        // gửi lên (tránh gửi trùng trong cùng một request)
        java.util.Set<UUID> payloadUserIds = new java.util.HashSet<>();
        for (AddParticipantRequest req : requests) {
            if (!payloadUserIds.add(req.getUserId())) {
                throw new AppException(ErrorCode.MEETING_PARTICIPANT_ALREADY_EXISTS);
            }
        }

        List<ParticipantResponse> responses = new ArrayList<>();
        for (AddParticipantRequest request : requests) {
            Optional<MeetingParticipant> existingOpt = meetingParticipantRepository
                    .findByMeetingIdAndUserId(meetingId, request.getUserId());

            MeetingParticipant participant;
            User user;
            if (existingOpt.isPresent()) {
                participant = existingOpt.get();
                user = participant.getUser();
                meetingParticipantMapper.updateEntity(request, participant);
            } else {
                user = userRepository.findById(request.getUserId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

                participant = meetingParticipantMapper.toEntity(request);
                participant.setMeeting(meeting);
                participant.setUser(user);
                participant.setInviteStatus(InviteStatus.PENDING);
                participant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);
            }

            // RÀNG BUỘC PARTICIPANT-02: Kiểm tra trạng thái tài khoản của đại biểu, bắt
            // buộc phải là ACTIVE mới được thêm vào cuộc họp
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new AppException(ErrorCode.USER_NOT_ACTIVE);
            }

            meetingParticipantRepository.save(participant);
            responses.add(meetingParticipantMapper.toResponse(participant));

            auditLogPublisher.publish(
                    currentUserService.getCurrentActiveUser(),
                    AuditAction.ADD_PARTICIPANT,
                    ResourceType.PARTICIPANT,
                    participant.getId(),
                    Map.of("meetingId", String.valueOf(meetingId), "type", "INTERNAL", "userId",
                            String.valueOf(request.getUserId())));
        }

        // Validate chair count limit
        long chairCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId,
                ParticipantRole.CHAIR);
        if (chairCount > 3) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        return responses;
    }

    @Transactional
    public List<GuestResponse> addExternalGuests(UUID meetingId, List<AddGuestRequest> requests) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);
        validateMeetingStateForParticipantMod(meeting);

        List<GuestResponse> responses = new ArrayList<>();
        for (AddGuestRequest request : requests) {
            Optional<MeetingGuest> existingOpt = meetingGuestRepository
                    .findByMeetingIdAndEmail(meetingId, request.getEmail());

            MeetingGuest guest;
            if (existingOpt.isPresent()) {
                guest = existingOpt.get();
                meetingGuestMapper.updateEntity(request, guest);
            } else {
                guest = meetingGuestMapper.toEntity(request);
                guest.setMeeting(meeting);
                guest.setRsvpToken(UUID.randomUUID());
                guest.setInviteStatus(InviteStatus.PENDING);
                guest.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);
            }

            meetingGuestRepository.save(guest);
            responses.add(meetingGuestMapper.toResponse(guest));

            auditLogPublisher.publish(
                    currentUserService.getCurrentActiveUser(),
                    AuditAction.ADD_PARTICIPANT,
                    ResourceType.PARTICIPANT,
                    guest.getId(),
                    Map.of("meetingId", String.valueOf(meetingId), "type", "GUEST", "email",
                            String.valueOf(request.getEmail())));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public MeetingAttendeesResponse getAttendees(UUID meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
        List<MeetingGuest> guests = meetingGuestRepository.findByMeetingId(meetingId);

        Map<UUID, MeetingParticipant> participantMap = participants.stream()
                .collect(Collectors.toMap(MeetingParticipant::getId, p -> p, (e1, e2) -> e1));

        Map<UUID, String> agendaTitles = meeting.getAgendaItemList() == null ? java.util.Map.of()
                : meeting.getAgendaItemList().stream()
                        .filter(item -> item.getId() != null && item.getTitle() != null)
                        .collect(Collectors.toMap(vn.acme.paperless_meeting.entity.AgendaItem::getId,
                                vn.acme.paperless_meeting.entity.AgendaItem::getTitle, (e1, e2) -> e1));

        // Key: substituteUserId -> participant gốc
        Map<UUID, MeetingParticipant> substituteUserIdToOriginal = participants.stream()
                .filter(p -> p.getSubstituteUser() != null)
                .collect(java.util.stream.Collectors.toMap(
                        p -> p.getSubstituteUser().getId(),
                        p -> p,
                        (existing, duplicate) -> existing // giữ bản ghi đầu nếu trùng key
                ));
        // Key: substituteEmail lowercase -> participant gốc
        Map<String, MeetingParticipant> substituteEmailToOriginal = participants.stream()
                .filter(p -> p.getSubstituteEmail() != null)
                .collect(java.util.stream.Collectors.toMap(
                        p -> p.getSubstituteEmail().toLowerCase(),
                        p -> p,
                        (existing, duplicate) -> existing));

        List<ParticipantResponse> participantResponses = new ArrayList<>();
        List<GuestResponse> guestResponses = new ArrayList<>();

        // 1. Map thành viên nội bộ với O(1) lookup
        for (MeetingParticipant p : participants) {
            ParticipantResponse resp = meetingParticipantMapper.toResponse(p);
            MeetingParticipant original = p.getUser() != null ? substituteUserIdToOriginal.get(p.getUser().getId())
                    : null;
            if (original != null) {
                resp.setSubstitutedForUserName(original.getUser().getFullName());
                resp.setSubstitutedForUserPosition(original.getUser().getPosition() != null
                        ? original.getUser().getPosition().getPositionName()
                        : "");
                resp.setIsSubstitute(true);
                resp.setSubstituteForParticipantId(original.getId());
            }
            if (p.getSubstituteForParticipantId() != null) {
                resp.setIsSubstitute(true);
                MeetingParticipant orig = participantMap.get(p.getSubstituteForParticipantId());
                if (orig != null && orig.getUser() != null) {
                    resp.setSubstitutedForUserName(orig.getUser().getFullName());
                    resp.setSubstitutedForUserPosition(orig.getUser().getPosition() != null
                            ? orig.getUser().getPosition().getPositionName()
                            : "");
                }
            }
            if (p.getAbsentAgendaItemIds() != null) {
                java.util.Set<String> titles = p.getAbsentAgendaItemIds().stream()
                        .map(agendaTitles::get)
                        .filter(java.util.Objects::nonNull)
                        .collect(Collectors.toSet());
                resp.setAbsentAgendaItemTitles(titles);
            }
            participantResponses.add(resp);
        }

        // 2. Map khách ngoài với O(1) lookup
        for (MeetingGuest g : guests) {
            GuestResponse resp = meetingGuestMapper.toResponse(g);
            if (g.getEmail() != null) {
                MeetingParticipant original = substituteEmailToOriginal.get(g.getEmail().toLowerCase());
                if (original != null) {
                    resp.setSubstitutedForUserName(original.getUser().getFullName());
                    resp.setSubstitutedForUserPosition(original.getUser().getPosition() != null
                            ? original.getUser().getPosition().getPositionName()
                            : "");
                    resp.setIsSubstitute(true);
                    resp.setSubstituteForParticipantId(original.getId());
                }
            }
            if (g.getSubstituteForParticipantId() != null) {
                resp.setIsSubstitute(true);
                MeetingParticipant orig = participantMap.get(g.getSubstituteForParticipantId());
                if (orig != null && orig.getUser() != null) {
                    resp.setSubstitutedForUserName(orig.getUser().getFullName());
                    resp.setSubstitutedForUserPosition(orig.getUser().getPosition() != null
                            ? orig.getUser().getPosition().getPositionName()
                            : "");
                }
            }
            guestResponses.add(resp);
        }

        return MeetingAttendeesResponse.builder()
                .participants(participantResponses)
                .guests(guestResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public AttendeeStatisticsResponse getAttendeeStatistics(UUID meetingId) {
        MeetingAttendeesResponse attendees = getAttendees(meetingId);

        int totalAttendees = attendees.getParticipants().size() + attendees.getGuests().size();
        int totalCheckedIn = 0;
        int totalPending = 0;
        int totalDeclined = 0;
        int totalAccepted = 0;

        for (ParticipantResponse p : attendees.getParticipants()) {
            if (p.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                totalCheckedIn++;
            }
            if (p.getInviteStatus() == InviteStatus.PENDING) {
                totalPending++;
            } else if (p.getInviteStatus() == InviteStatus.DECLINED) {
                totalDeclined++;
            } else if (p.getInviteStatus() == InviteStatus.ACCEPTED) {
                totalAccepted++;
            }
        }

        for (GuestResponse g : attendees.getGuests()) {
            if (g.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                totalCheckedIn++;
            }
            if (g.getInviteStatus() == InviteStatus.PENDING) {
                totalPending++;
            } else if (g.getInviteStatus() == InviteStatus.DECLINED) {
                totalDeclined++;
            } else if (g.getInviteStatus() == InviteStatus.ACCEPTED) {
                totalAccepted++;
            }
        }

        return AttendeeStatisticsResponse.builder()
                .totalAttendees(totalAttendees)
                .totalCheckedIn(totalCheckedIn)
                .totalPending(totalPending)
                .totalDeclined(totalDeclined)
                .totalAccepted(totalAccepted)
                .build();
    }

    @Transactional
    public void updateInviteStatus(UUID meetingId, UUID userId, UpdateInviteStatusRequest request) {
        Meeting meeting = getMeeting(meetingId);
        validateMeetingStateForRsvp(meeting);

        MeetingParticipant participant = meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        if (!caller.getId().equals(userId) && !currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            boolean isOwner = meeting.getCreatedBy().getId().equals(caller.getId());
            boolean isDeptAdmin = currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)
                    && caller.getDepartment() != null
                    && caller.getDepartment().getId().equals(meeting.getDepartment().getId());
            boolean isChair = meetingParticipantRepository.findByMeetingIdAndUserId(meetingId, caller.getId())
                    .map(p -> p.getParticipantRole() == ParticipantRole.CHAIR)
                    .orElse(false);
            if (!isOwner && !isDeptAdmin && !isChair) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        if (request.getInviteStatus() == InviteStatus.ACCEPTED) {
            // Check trùng lịch bận (ACCEPTED ở cuộc họp APPROVED, UPCOMING, IN_PROGRESS
            // khác)
            boolean overlap = meetingParticipantRepository.hasOverlapConflict(
                    userId, InviteStatus.ACCEPTED, meetingId, ACTIVE_MEETING_STATUSES, meeting.getStartTime(),
                    meeting.getEndTime());
            if (overlap) {
                throw new AppException(ErrorCode.MEETING_LOCATION_TIME_CONFLICT);
            }
        }

        InviteStatus oldStatus = participant.getInviteStatus();
        participant.setInviteStatus(request.getInviteStatus());

        if (oldStatus == InviteStatus.ACCEPTED && request.getInviteStatus() == InviteStatus.DECLINED) {
            // RÀNG BUỘC INVITE-06: Cảnh báo khi đại biểu "quay xe" từ ĐỒNG Ý sang TỪ CHỐI
            List<MeetingParticipant> chairs = meetingParticipantRepository.findByMeetingId(meetingId)
                    .stream()
                    .filter(p -> p.getParticipantRole() == ParticipantRole.CHAIR)
                    .collect(Collectors.toList());

            String msg = String.format(
                    "Cảnh báo: Đại biểu %s đã đổi ý từ ĐỒNG Ý thành TỪ CHỐI tham dự cuộc họp \"%s\".",
                    participant.getUser().getFullName(), meeting.getTitle());

            for (MeetingParticipant chairObj : chairs) {
                Notification notification = new Notification();
                notification.setUser(chairObj.getUser());
                notification.setType(NotificationType.RSVP_ALERT);
                notification.setStatus(NotificationStatus.PENDING);
                notification.setChannel(ChannelType.APP);
                notification.setRefType(ResourceType.MEETING);
                notification.setRefId(meetingId);
                notification.setContent(msg);
                notification.setScheduledAt(LocalDateTime.now());
                if (notificationRepository != null) {
                    notificationRepository.save(notification);
                }
            }
        }

        if (request.getInviteStatus() == InviteStatus.DECLINED) {
            participant.setDeclineReason(request.getDeclineReason());
            participant.setIsFullSession(request.getIsFullSession() != null ? request.getIsFullSession() : true);
            participant.getAbsentAgendaItemIds().clear();
            if (request.getAbsentAgendaItemIds() != null) {
                participant.getAbsentAgendaItemIds().addAll(request.getAbsentAgendaItemIds());

                int totalItems = meeting.getAgendaItemList() != null ? meeting.getAgendaItemList().size() : 0;
                if (totalItems > 0 && participant.getAbsentAgendaItemIds().size() >= totalItems) {
                    participant.setIsFullSession(true);
                }
            }

            if (request.getSubstituteUserId() != null) {
                User substitute = userRepository.findById(request.getSubstituteUserId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
                participant.setSubstituteUser(substitute);
                participant.setSubstituteName(substitute.getFullName());
                if (substitute.getPosition() != null) {
                    participant.setSubstitutePosition(substitute.getPosition().getPositionName());
                } else {
                    participant.setSubstitutePosition(null);
                }
                if (substitute.getDepartment() != null) {
                    participant.setSubstituteDepartment(substitute.getDepartment().getDeptName());
                    participant.setSubstituteCompany(substitute.getDepartment().getDeptName());
                } else {
                    participant.setSubstituteDepartment(null);
                    participant.setSubstituteCompany(null);
                }

                // Auto register internal substitute as participant
                MeetingParticipant substitutePart = meetingParticipantRepository
                        .findByMeetingIdAndUserId(meetingId, request.getSubstituteUserId())
                        .orElse(null);
                if (substitutePart == null) {
                    substitutePart = new MeetingParticipant();
                    substitutePart.setMeeting(meeting);
                    substitutePart.setUser(substitute);
                    substitutePart.setParticipantRole(ParticipantRole.PARTICIPANT);
                    substitutePart.setInviteStatus(InviteStatus.PENDING);
                    substitutePart.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);
                }
                substitutePart.setIsSubstitute(true);
                substitutePart.setSubstituteForParticipantId(participant.getId());
                substitutePart = meetingParticipantRepository.save(substitutePart);

                // If newly created/never sent, auto-send invitation email
                if (substitutePart.getSendStatus() == null) {
                    if (substitute.getEmail() != null && !substitute.getEmail().isBlank()) {
                        try {
                            String confirmUrl = backendUrl + "/meetings/public/rsvp/confirm?participantId="
                                    + substitutePart.getId();
                            invitationMailService.sendMeetingInvitation(meeting, substitute,
                                    meeting.getInvitationContent(), confirmUrl);
                            substitutePart.setSendStatus(SendStatus.SENT);
                        } catch (Exception e) {
                            substitutePart.setSendStatus(SendStatus.FAILED);
                        }
                        meetingParticipantRepository.save(substitutePart);
                    }
                }
            } else {
                participant.setSubstituteUser(null);
                participant.setSubstituteName(request.getSubstituteName());
                participant.setSubstitutePosition(request.getSubstitutePosition());
                participant.setSubstituteCompany(request.getSubstituteCompany());
                participant.setSubstituteDepartment(request.getSubstituteDepartment());
                participant.setSubstituteEmail(request.getSubstituteEmail());
                participant.setSubstitutePhone(request.getSubstitutePhone());

                // Auto register external substitute as MeetingGuest if email is provided
                if (request.getSubstituteEmail() != null && !request.getSubstituteEmail().isEmpty()) {
                    MeetingGuest guest = meetingGuestRepository
                            .findByMeetingIdAndEmail(meetingId, request.getSubstituteEmail())
                            .orElse(null);
                    if (guest == null) {
                        guest = MeetingGuest.builder()
                                .meeting(meeting)
                                .fullName(request.getSubstituteName())
                                .email(request.getSubstituteEmail())
                                .phone(request.getSubstitutePhone())
                                .company(request.getSubstituteCompany())
                                .position(request.getSubstitutePosition())
                                .description("Thay thế cho đại biểu "
                                        + (participant.getUser() != null ? participant.getUser().getFullName() : ""))
                                .rsvpToken(UUID.randomUUID())
                                .guestToken(null)
                                .inviteStatus(InviteStatus.PENDING)
                                .attendanceStatus(AttendanceStatus.NOT_CHECKED_IN)
                                .build();
                    }
                    guest.setIsSubstitute(true);
                    guest.setSubstituteForParticipantId(participant.getId());

                    if (guest.getId() == null) {
                        guest = meetingGuestRepository.save(guest);
                        try {
                            String confirmUrl = backendUrl + "/meetings/public/rsvp/confirm?rsvpToken="
                                    + guest.getRsvpToken();
                            invitationMailService.sendGuestMeetingInvitation(meeting, guest,
                                    meeting.getInvitationContent(), confirmUrl);
                            guest.setSendStatus(SendStatus.SENT);
                        } catch (Exception e) {
                            guest.setSendStatus(SendStatus.FAILED);
                        }
                    }
                    meetingGuestRepository.save(guest);
                }
            }
        } else {
            // Clean if ACCEPTED or PENDING
            // Revoke substitute role from linked participants/guests
            List<MeetingParticipant> subsP = meetingParticipantRepository
                    .findBySubstituteForParticipantId(participant.getId());
            for (MeetingParticipant sub : subsP) {
                sub.setIsSubstitute(false);
                sub.setSubstituteForParticipantId(null);
                meetingParticipantRepository.save(sub);
            }
            List<MeetingGuest> subsG = meetingGuestRepository.findBySubstituteForParticipantId(participant.getId());
            for (MeetingGuest sub : subsG) {
                sub.setIsSubstitute(false);
                sub.setSubstituteForParticipantId(null);
                meetingGuestRepository.save(sub);
            }

            participant.setDeclineReason(null);
            participant.setSubstituteUser(null);
            participant.setSubstituteName(null);
            participant.setSubstitutePosition(null);
            participant.setSubstituteCompany(null);
            participant.setSubstituteDepartment(null);
            participant.setSubstituteEmail(null);
            participant.setSubstitutePhone(null);
            participant.setIsFullSession(true);
            participant.getAbsentAgendaItemIds().clear();
        }

        meetingParticipantRepository.save(participant);
    }

    @Transactional(readOnly = true)
    public PublicMeetingInviteResponse publicGetInviteByRsvpToken(UUID rsvpToken) {
        MeetingGuest guest = meetingGuestRepository.findByRsvpToken(rsvpToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        Meeting meeting = guest.getMeeting();
        return PublicMeetingInviteResponse.builder()
                .meetingId(meeting.getId())
                .title(meeting.getTitle())
                .startTime(meeting.getStartTime())
                .endTime(meeting.getEndTime())
                .inviterName(meeting.getCreatedBy().getFullName())
                .deptName(meeting.getDepartment() != null ? meeting.getDepartment().getDeptName() : "")
                .build();
    }

    @Transactional
    public GuestResponse publicUpdateGuestRsvpByRsvpToken(UUID rsvpToken, UpdateInviteStatusRequest request) {
        MeetingGuest guest = meetingGuestRepository.findByRsvpToken(rsvpToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        Meeting meeting = guest.getMeeting();
        validateMeetingStateForRsvp(meeting);

        if (request.getInviteStatus() == InviteStatus.ACCEPTED) {
            // Check trùng lịch bận cho khách theo Email
            boolean overlap = meetingGuestRepository.hasGuestOverlapConflict(
                    guest.getEmail(), InviteStatus.ACCEPTED, meeting.getId(), ACTIVE_MEETING_STATUSES,
                    meeting.getStartTime(), meeting.getEndTime());
            if (overlap) {
                throw new AppException(ErrorCode.MEETING_LOCATION_TIME_CONFLICT);
            }

            guest.setInviteStatus(InviteStatus.ACCEPTED);
            // Sinh guestToken chính thức để vào buồng họp
            if (guest.getGuestToken() == null) {
                guest.setGuestToken(UUID.randomUUID());
            }
            meetingGuestRepository.save(guest);
        } else {
            guest.setInviteStatus(request.getInviteStatus());
            meetingGuestRepository.save(guest);
        }

        return meetingGuestMapper.toResponse(guest);
    }

    private void validateGuestMeetingTimeAccess(MeetingGuest guest) {
        if (guest.getInviteStatus() != InviteStatus.ACCEPTED) {
            throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
        }

        Meeting meeting = guest.getMeeting();
        LocalDateTime now = LocalDateTime.now();

        if (meeting.getStartTime() != null && now.isBefore(meeting.getStartTime().minusMinutes(30))) {
            throw new AppException(ErrorCode.MEETING_NOT_STARTED);
        }

        if (meeting.getStatus() == MeetingStatus.CLOSED ||
                meeting.getStatus() == MeetingStatus.CANCELLED ||
                (meeting.getEndTime() != null && now.isAfter(meeting.getEndTime()))) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED);
        }
    }

    @Transactional(readOnly = true)
    public MeetingResponse publicGetMeetingByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        validateGuestMeetingTimeAccess(guest);

        return meetingMapper.toResponse(guest.getMeeting());
    }

    @Transactional(readOnly = true)
    public List<MeetingDocumentResponse> publicGetMeetingDocumentsByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        validateGuestMeetingTimeAccess(guest);

        // Lấy toàn bộ tài liệu của cuộc họp này ra
        List<MeetingDocumentResponse> documents = documentService.getMeetingDocuments(guest.getMeeting().getId());
        // Lọc bỏ các tài liệu mật (isConfidential = true) để khách mời không thể xem
        // hoặc tải về
        return documents.stream()
                .filter(doc -> doc.getIsConfidential() == null || !doc.getIsConfidential())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> publicDownloadDocument(
            UUID documentId, UUID guestToken, boolean inline) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        validateGuestMeetingTimeAccess(guest);

        DocumentVersion version = documentService.getDocumentVersionForPublic(documentId, guest.getMeeting().getId());

        InputStream stream = documentService.getFileStream(version.getStorageKey());
        Resource resource = new InputStreamResource(stream);

        String contentType = "application/octet-stream";
        if (version.getFileName() != null) {
            String lowerName = version.getFileName().toLowerCase();
            if (lowerName.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (lowerName.endsWith(".docx")) {
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            } else if (lowerName.endsWith(".doc")) {
                contentType = "application/msword";
            } else if (lowerName.endsWith(".xlsx")) {
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else if (lowerName.endsWith(".xls")) {
                contentType = "application/vnd.ms-excel";
            }
        }

        String dispositionType = inline ? "inline" : "attachment";
        ContentDisposition contentDisposition = ContentDisposition.builder(dispositionType)
                .filename(version.getFileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
    }

    @Transactional
    public AttendeeResponse updateAttendanceStatus(UUID meetingId, UUID attendeeId, String type,
            UpdateAttendanceStatusRequest request) {
        Meeting meeting = getMeeting(meetingId);

        if (meeting.getStatus() == MeetingStatus.CLOSED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED);
        }

        User caller = null;
        try {
            caller = currentUserService.getCurrentActiveUser();
        } catch (Exception e) {
            // Ignore if not authenticated
        }

        boolean isSelfCheckin = false;
        MeetingParticipant participant = null;
        MeetingGuest guest = null;

        if ("INTERNAL".equalsIgnoreCase(type)) {
            participant = meetingParticipantRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (!participant.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            if (caller != null && participant.getUser() != null
                    && caller.getId().equals(participant.getUser().getId())) {
                isSelfCheckin = true;
            }
        } else {
            guest = meetingGuestRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (!guest.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
        }

        if (isSelfCheckin && request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
            // Self check-in allowed
        } else {
            requireAttendancePermission(meeting);
        }

        LocalDateTime now = LocalDateTime.now();
        Integer lateMinutes = calculateLateMinutes(meeting, now);

        if ("INTERNAL".equalsIgnoreCase(type)) {
            if (request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                if (participant.getInviteStatus() == InviteStatus.DECLINED) {
                    if (participant.getIsFullSession() == null || participant.getIsFullSession()) {
                        throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
                    }
                    participant.setInviteStatus(InviteStatus.ACCEPTED);

                    // Revoke substitute role from linked participants/guests
                    List<MeetingParticipant> subsP = meetingParticipantRepository
                            .findBySubstituteForParticipantId(participant.getId());
                    for (MeetingParticipant sub : subsP) {
                        sub.setIsSubstitute(false);
                        sub.setSubstituteForParticipantId(null);
                        meetingParticipantRepository.save(sub);
                    }
                    List<MeetingGuest> subsG = meetingGuestRepository
                            .findBySubstituteForParticipantId(participant.getId());
                    for (MeetingGuest sub : subsG) {
                        sub.setIsSubstitute(false);
                        sub.setSubstituteForParticipantId(null);
                        meetingGuestRepository.save(sub);
                    }

                    participant.setDeclineReason(null);
                    participant.setSubstituteUser(null);
                    participant.setSubstituteName(null);
                    participant.setSubstitutePosition(null);
                    participant.setSubstituteCompany(null);
                    participant.setSubstituteDepartment(null);
                    participant.setSubstituteEmail(null);
                    participant.setSubstitutePhone(null);
                    participant.setIsFullSession(true);
                    participant.getAbsentAgendaItemIds().clear();
                } else if (participant.getInviteStatus() == InviteStatus.PENDING) {
                    throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
                }
            }

            participant.setAttendanceStatus(request.getAttendanceStatus());
            meetingParticipantRepository.save(participant);

            if (request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                // Ghi nhận log điểm danh
                AttendanceLog log = attendanceLogRepository
                        .findByMeetingIdAndUserId(meetingId, participant.getUser().getId())
                        .orElse(new AttendanceLog());
                log.setMeeting(meeting);
                log.setUser(participant.getUser());
                log.setCheckinTime(now);
                log.setStatus(AttendanceStatus.PRESENT);
                log.setLateMinutes(lateMinutes);
                log.setNote(request.getNote());
                log.setRecordedBy(isSelfCheckin ? null : caller);
                User actorUser = caller != null ? caller : participant.getUser();
                auditLogPublisher.publish(
                        actorUser,
                        AuditAction.PARTICIPANT_CHECK_IN,
                        ResourceType.MEETING,
                        meetingId,
                        Map.of(
                                "meetingId", String.valueOf(meetingId),
                                "title", meeting.getTitle() != null ? meeting.getTitle() : "",
                                "attendeeType", "INTERNAL",
                                "attendeeName",
                                participant.getUser().getFullName() != null ? participant.getUser().getFullName()
                                        : ""));
                attendanceLogRepository.save(log);
            } else {
                // Nếu đánh dấu vắng mặt/lý do khác, cập nhật log (nếu có)
                attendanceLogRepository.findByMeetingIdAndUserId(meetingId, participant.getUser().getId())
                        .ifPresent(log -> {
                            log.setStatus(request.getAttendanceStatus());
                            attendanceLogRepository.save(log);
                        });
            }

            // Gửi tin nhắn WebSocket để đồng bộ realtime danh sách điểm danh cho các client
            // khác
            webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId,
                    Map.of("action", "REFRESH_ATTENDEES"));

            return enrichAttendeeResponse(meetingParticipantMapper.toAttendeeResponse(participant), participant);

        } else {
            if (request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                if (guest.getInviteStatus() == InviteStatus.PENDING) {
                    guest.setInviteStatus(InviteStatus.ACCEPTED);
                } else if (guest.getInviteStatus() == InviteStatus.DECLINED) {
                    throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
                }
            }

            guest.setAttendanceStatus(request.getAttendanceStatus());
            meetingGuestRepository.save(guest);

            if (request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                // Ghi nhận log điểm danh
                AttendanceLog log = attendanceLogRepository.findByMeetingIdAndGuestId(meetingId, guest.getId())
                        .orElse(new AttendanceLog());
                log.setMeeting(meeting);
                log.setGuest(guest);
                log.setCheckinTime(now);
                log.setStatus(AttendanceStatus.PRESENT);
                log.setLateMinutes(lateMinutes);
                log.setNote(request.getNote());
                log.setRecordedBy(caller);
                if (caller != null) {
                    auditLogPublisher.publish(
                            caller,
                            AuditAction.PARTICIPANT_CHECK_IN,
                            ResourceType.MEETING,
                            meetingId,
                            Map.of(
                                    "meetingId", String.valueOf(meetingId),
                                    "title", meeting.getTitle() != null ? meeting.getTitle() : "",
                                    "attendeeType", "EXTERNAL",
                                    "attendeeName", guest.getFullName() != null ? guest.getFullName() : ""));
                }
                attendanceLogRepository.save(log);
            } else {
                attendanceLogRepository.findByMeetingIdAndGuestId(meetingId, guest.getId())
                        .ifPresent(log -> {
                            log.setStatus(request.getAttendanceStatus());
                            attendanceLogRepository.save(log);
                        });
            }

            // Gửi tin nhắn WebSocket để đồng bộ realtime danh sách điểm danh cho các client
            // khác
            webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId,
                    Map.of("action", "REFRESH_ATTENDEES"));

            return enrichAttendeeResponse(meetingGuestMapper.toAttendeeResponse(guest), guest);
        }
    }

    @Transactional
    public AttendeeResponse publicUpdateAttendanceStatus(UUID guestToken, UpdateAttendanceStatusRequest request) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        validateGuestMeetingTimeAccess(guest);

        Meeting meeting = guest.getMeeting();
        if (meeting.getStatus() == MeetingStatus.CLOSED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED);
        }

        LocalDateTime now = LocalDateTime.now();
        Integer lateMinutes = calculateLateMinutes(meeting, now);

        if (request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
            if (guest.getInviteStatus() == InviteStatus.PENDING) {
                guest.setInviteStatus(InviteStatus.ACCEPTED);
            } else if (guest.getInviteStatus() == InviteStatus.DECLINED) {
                throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
            }
        }

        guest.setAttendanceStatus(request.getAttendanceStatus());
        meetingGuestRepository.save(guest);

        if (request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
            // Ghi nhận log điểm danh
            AttendanceLog log = attendanceLogRepository.findByMeetingIdAndGuestId(meeting.getId(), guest.getId())
                    .orElse(new AttendanceLog());
            log.setMeeting(meeting);
            log.setGuest(guest);
            log.setCheckinTime(now);
            log.setStatus(AttendanceStatus.PRESENT);
            log.setLateMinutes(lateMinutes);
            log.setNote(request.getNote());
            log.setRecordedBy(null); // Tự điểm danh
            attendanceLogRepository.save(log);
        } else {
            attendanceLogRepository.findByMeetingIdAndGuestId(meeting.getId(), guest.getId())
                    .ifPresent(log -> {
                        log.setStatus(request.getAttendanceStatus());
                        attendanceLogRepository.save(log);
                    });
        }

        // Gửi tin nhắn WebSocket để đồng bộ realtime danh sách điểm danh cho các client
        // khác
        webSocketNotificationService.sendToTopic("/topic/meeting/" + meeting.getId(),
                Map.of("action", "REFRESH_ATTENDEES"));

        return enrichAttendeeResponse(meetingGuestMapper.toAttendeeResponse(guest), guest);
    }

    @Transactional
    public void removeAttendee(UUID meetingId, UUID attendeeId, String type) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);
        validateMeetingStateForParticipantMod(meeting);

        if ("INTERNAL".equalsIgnoreCase(type)) {
            MeetingParticipant participant = meetingParticipantRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (participant.getMeeting() == null || !participant.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            // RÀNG BUỘC PARTICIPANT-06 & 07: Không cho phép xoá Chủ tọa (CHAIR) hoặc Thư ký
            // (SECRETARY) cuối cùng của cuộc họp để tránh lỗi mồ côi
            if (participant.getParticipantRole() == ParticipantRole.CHAIR) {
                long chairCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId,
                        ParticipantRole.CHAIR);
                if (chairCount <= 1) {
                    throw new AppException(ErrorCode.MEETING_CHAIR_REQUIRED);
                }
            } else if (participant.getParticipantRole() == ParticipantRole.SECRETARY) {
                long secretaryCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId,
                        ParticipantRole.SECRETARY);
                if (secretaryCount <= 1) {
                    throw new AppException(ErrorCode.MEETING_SECRETARY_REQUIRED);
                }
            }

            meetingParticipantRepository.delete(participant);

            // RÀNG BUỘC PARTICIPANT-12: Khi xoá đại biểu, thu hồi quyền biểu quyết
            // (VoteEligibility) của họ đối với các biểu quyết chưa kết thúc
            if (voteEligibilityRepository != null && participant.getUser() != null) {
                voteEligibilityRepository.revokeVoteEligibility(meetingId, participant.getUser().getId(),
                        "Đã bị loại khỏi cuộc họp");
            }

            auditLogPublisher.publish(
                    currentUserService.getCurrentActiveUser(),
                    AuditAction.REMOVE_PARTICIPANT,
                    ResourceType.PARTICIPANT,
                    attendeeId,
                    Map.of("meetingId", String.valueOf(meetingId), "type", "INTERNAL"));
        } else {
            MeetingGuest guest = meetingGuestRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (guest.getMeeting() == null || !guest.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            meetingGuestRepository.delete(guest);

            auditLogPublisher.publish(
                    currentUserService.getCurrentActiveUser(),
                    AuditAction.REMOVE_PARTICIPANT,
                    ResourceType.PARTICIPANT,
                    attendeeId,
                    Map.of("meetingId", String.valueOf(meetingId), "type", "GUEST"));
        }
    }

    @Transactional
    public void sendInvitations(UUID meetingId, SendInvitationsRequest request) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);

        // RÀNG BUỘC INVITE-01: Chặn gửi thư mời khi cuộc họp chưa được duyệt
        if (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        boolean forceResend = Boolean.TRUE.equals(request.getForceResend());

        // RÀNG BUỘC INVITE-03: Tính năng chống lưu nháp (dùng list user/guest mới nhất
        // trong DB)
        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
        List<MeetingGuest> guests = meetingGuestRepository.findByMeetingId(meetingId);

        if (request.getUserIds() != null && !request.getUserIds().isEmpty()) {
            participants = participants.stream()
                    .filter(p -> request.getUserIds().contains(p.getUser().getId()))
                    .collect(Collectors.toList());
        }

        if (request.getGuestIds() != null && !request.getGuestIds().isEmpty()) {
            guests = guests.stream()
                    .filter(g -> request.getGuestIds().contains(g.getId()))
                    .collect(Collectors.toList());
        }

        LocalDateTime now = LocalDateTime.now();
        User caller = currentUserService.getCurrentActiveUser();

        for (MeetingParticipant p : participants) {
            // RÀNG BUỘC INVITE-02: Chống gửi lặp thư mời (ngoại trừ admin ép gửi lại -
            // forceResend = true)
            if (!forceResend) {
                boolean alreadySent = meetingInvitationRepository.existsByMeetingIdAndInviteeUserIdAndSendStatus(
                        meetingId, p.getUser().getId(), SendStatus.SENT);
                if (alreadySent)
                    continue;
            }

            MeetingInvitation invitation = new MeetingInvitation();
            invitation.setMeeting(meeting);
            invitation.setInviteeUser(p.getUser());
            invitation.setChannel(ChannelType.EMAIL);
            invitation.setSendStatus(SendStatus.SENT);
            invitation.setSentAt(now);
            invitation.setRsvpDeadline(meeting.getRsvpDeadline());
            invitation.setInvitedBy(caller);
            invitation.setMessage("Kính mời đại biểu tham dự cuộc họp: " + meeting.getTitle());
            meetingInvitationRepository.save(invitation);
        }

        for (MeetingGuest g : guests) {
            if (!forceResend) {
                boolean alreadySent = meetingInvitationRepository.existsByMeetingIdAndInviteeGuestIdAndSendStatus(
                        meetingId, g.getId(), SendStatus.SENT);
                if (alreadySent)
                    continue;
            }

            MeetingInvitation invitation = new MeetingInvitation();
            invitation.setMeeting(meeting);
            invitation.setInviteeGuest(g);
            invitation.setChannel(ChannelType.EMAIL);
            invitation.setSendStatus(SendStatus.SENT);
            invitation.setSentAt(now);
            invitation.setRsvpDeadline(meeting.getRsvpDeadline());
            invitation.setInvitedBy(caller);
            invitation.setMessage("Kính mời khách mời tham dự cuộc họp: " + meeting.getTitle());
            meetingInvitationRepository.save(invitation);
        }
    }

    @Transactional
    public void publicConfirmParticipantRsvp(UUID participantId) {
        MeetingParticipant participant = meetingParticipantRepository.findById(participantId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        Meeting meeting = participant.getMeeting();
        validateMeetingStateForRsvp(meeting);

        // Tránh gửi lại email xác nhận nếu đã xác nhận trước đó
        if (participant.getInviteStatus() == InviteStatus.ACCEPTED) {
            throw new AppException(ErrorCode.MEETING_PARTICIPANT_ALREADY_CONFIRMED);
        }

        participant.setInviteStatus(InviteStatus.ACCEPTED);
        meetingParticipantRepository.save(participant);

        // Send confirmation email containing join link
        String joinUrl = frontendUrl + "/phien-hop/" + meeting.getId();
        invitationMailService.sendMeetingJoinLink(meeting, participant.getUser(), joinUrl);
    }

    @Transactional
    public void publicConfirmGuestRsvp(UUID rsvpToken) {
        MeetingGuest guest = meetingGuestRepository.findByRsvpToken(rsvpToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        Meeting meeting = guest.getMeeting();
        validateMeetingStateForRsvp(meeting);

        // Tránh gửi lại email xác nhận nếu đã xác nhận trước đó
        if (guest.getInviteStatus() == InviteStatus.ACCEPTED) {
            throw new AppException(ErrorCode.MEETING_PARTICIPANT_ALREADY_CONFIRMED);
        }

        // Check trùng lịch bận cho khách theo Email
        boolean overlap = meetingGuestRepository.hasGuestOverlapConflict(
                guest.getEmail(), InviteStatus.ACCEPTED, meeting.getId(), ACTIVE_MEETING_STATUSES,
                meeting.getStartTime(), meeting.getEndTime());
        if (overlap) {
            throw new AppException(ErrorCode.MEETING_LOCATION_TIME_CONFLICT);
        }

        guest.setInviteStatus(InviteStatus.ACCEPTED);
        // Sinh guestToken chính thức để vào buồng họp
        if (guest.getGuestToken() == null) {
            guest.setGuestToken(UUID.randomUUID());
        }
        meetingGuestRepository.save(guest);

        // Gửi email xác nhận chứa link vào phòng họp cho khách
        String joinUrl = frontendUrl + "/phien-hop/" + meeting.getId() + "?guestToken=" + guest.getGuestToken();
        invitationMailService.sendGuestMeetingJoinLink(meeting, guest, joinUrl);
    }

    @Transactional
    public void publicConfirmRsvp(UUID participantId, UUID rsvpToken) {
        if (participantId != null) {
            publicConfirmParticipantRsvp(participantId);
        } else if (rsvpToken != null) {
            publicConfirmGuestRsvp(rsvpToken);
        } else {
            throw new IllegalArgumentException("Yêu cầu xác nhận không hợp lệ: Thiếu participantId hoặc rsvpToken.");
        }
    }

    public String renderRsvpSuccessHtml() {
        return mailTemplateService.renderRsvpSuccessHtml();
    }

    public String renderRsvpErrorHtml(String errorMessage) {
        return mailTemplateService.renderRsvpErrorHtml(errorMessage);
    }

    @Transactional(readOnly = true)
    public List<AgendaItemResponse> publicGetAgendaItemsByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return agendaItemService.publicGetAgendaItems(guest.getMeeting().getId());
    }

    @Transactional(readOnly = true)
    public List<SpeakerQueueResponse> publicGetSpeakersQueueByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return speakerService.publicGetQueue(guest.getMeeting().getId(), null);
    }

    @Transactional(readOnly = true)
    public List<MotionResponse> publicGetMeetingMotionsByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return motionService.getMeetingMotionsForGuest(guest.getMeeting().getId(), guest);
    }

    @Transactional
    public SpeakerQueueResponse publicRequestToSpeakByGuestToken(UUID guestToken, UUID agendaItemId) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return speakerService.publicRequestToSpeak(guest.getMeeting().getId(), agendaItemId, guestToken);
    }

    @Transactional(readOnly = true)
    public VoteStatisticsResponse publicGetVoteStatisticsByGuestToken(UUID motionId, UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return motionService.publicGetVoteStatistics(motionId);
    }

    @Transactional(readOnly = true)
    public List<OpinionResponse> publicGetOpinionsByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return opinionService.getOpinions(guest.getMeeting().getId());
    }

    @Transactional(readOnly = true)
    public MeetingAttendeesResponse publicGetAttendeesByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return getAttendees(guest.getMeeting().getId());
    }

    @Transactional
    public OpinionResponse publicCreateOpinionByGuestToken(UUID guestToken, OpinionRequest request) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
        validateGuestMeetingTimeAccess(guest);
        return opinionService.publicCreateOpinion(guest, request);
    }

    @Transactional
    public void resendEmail(UUID meetingId, UUID attendeeId, String type) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);

        if (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        if ("INTERNAL".equalsIgnoreCase(type) || "PARTICIPANT".equalsIgnoreCase(type)) {
            MeetingParticipant participant = meetingParticipantRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (!participant.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            if (participant.getUser() != null && participant.getUser().getEmail() != null
                    && !participant.getUser().getEmail().isBlank()) {
                try {
                    String confirmUrl = backendUrl + "/meetings/public/rsvp/confirm?participantId="
                            + participant.getId();
                    invitationMailService.sendMeetingInvitation(meeting, participant.getUser(),
                            meeting.getInvitationContent(), confirmUrl);
                    participant.setSendStatus(SendStatus.SENT);
                } catch (Exception e) {
                    participant.setSendStatus(SendStatus.FAILED);
                    meetingParticipantRepository.save(participant);
                    throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
                }
                meetingParticipantRepository.save(participant);
            }
        } else {
            MeetingGuest guest = meetingGuestRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (!guest.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            if (guest.getEmail() != null && !guest.getEmail().isBlank()) {
                try {
                    String confirmUrl = backendUrl + "/meetings/public/rsvp/confirm?rsvpToken=" + guest.getRsvpToken();
                    invitationMailService.sendGuestMeetingInvitation(meeting, guest, meeting.getInvitationContent(),
                            confirmUrl);
                    guest.setSendStatus(SendStatus.SENT);
                } catch (Exception e) {
                    guest.setSendStatus(SendStatus.FAILED);
                    meetingGuestRepository.save(guest);
                    throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
                }
                meetingGuestRepository.save(guest);
            }
        }
    }

    private List<UUID> getAllSubDepartmentIds(UUID rootDeptId) {
        if (rootDeptId == null)
            return List.of();
        List<UUID> allIds = new java.util.ArrayList<>();
        allIds.add(rootDeptId);

        List<UUID> current = List.of(rootDeptId);
        while (!current.isEmpty()) {
            List<UUID> childIds = departmentRepository.findIdsByParentDepartmentIdIn(current);
            if (childIds == null || childIds.isEmpty()) {
                break;
            }
            allIds.addAll(childIds);
            current = childIds;
        }
        return allIds;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getEligibleSubstitutes(UUID meetingId) {
        User currentUser = currentUserService.getCurrentActiveUser();
        if (currentUser.getDepartment() == null) {
            return List.of();
        }

        UUID departmentId = currentUser.getDepartment().getId();
        Integer currentUserRank = currentUser.getPosition() != null && currentUser.getPosition().getRankOrder() != null
                ? currentUser.getPosition().getRankOrder()
                : Integer.MAX_VALUE;

        // Fetch all active users in the same department and its sub-departments
        // recursively
        List<UUID> deptIds = getAllSubDepartmentIds(departmentId);
        List<User> departmentUsers = userRepository.findByDepartmentIdInAndStatus(deptIds, UserStatus.ACTIVE);

        // Find users already invited/added to the meeting as participants
        List<UUID> existingParticipantUserIds = meetingParticipantRepository.findByMeetingId(meetingId)
                .stream()
                .map(p -> p.getUser() != null ? p.getUser().getId() : null)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        return departmentUsers.stream()
                .filter(u -> !u.getId().equals(currentUser.getId())) // exclude current user
                .filter(u -> !existingParticipantUserIds.contains(u.getId())) // exclude already invited
                .filter(u -> {
                    Integer rank = u.getPosition() != null && u.getPosition().getRankOrder() != null
                            ? u.getPosition().getRankOrder()
                            : Integer.MAX_VALUE;
                    return rank >= currentUserRank; // equal or lower rank (larger rankOrder means lower rank)
                })
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    private AttendeeResponse enrichAttendeeResponse(AttendeeResponse resp, MeetingParticipant p) {
        if (resp == null)
            return null;
        if (p.getSubstituteForParticipantId() != null) {
            meetingParticipantRepository.findById(p.getSubstituteForParticipantId()).ifPresent(orig -> {
                if (orig.getUser() != null) {
                    resp.setSubstituteForName(orig.getUser().getFullName());
                }
            });
        }
        if (p.getAbsentAgendaItemIds() != null && !p.getAbsentAgendaItemIds().isEmpty() && p.getMeeting() != null) {
            Map<UUID, String> agendaTitles = p.getMeeting().getAgendaItemList().stream()
                    .collect(Collectors.toMap(vn.acme.paperless_meeting.entity.AgendaItem::getId,
                            vn.acme.paperless_meeting.entity.AgendaItem::getTitle, (e1, e2) -> e1));
            java.util.Set<String> titles = p.getAbsentAgendaItemIds().stream()
                    .map(agendaTitles::get)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toSet());
            resp.setAbsentAgendaItemTitles(titles);
        }
        return resp;
    }

    private AttendeeResponse enrichAttendeeResponse(AttendeeResponse resp, MeetingGuest g) {
        if (resp == null)
            return null;
        if (g.getSubstituteForParticipantId() != null) {
            meetingParticipantRepository.findById(g.getSubstituteForParticipantId()).ifPresent(orig -> {
                if (orig.getUser() != null) {
                    resp.setSubstituteForName(orig.getUser().getFullName());
                }
            });
        }
        return resp;
    }
}
