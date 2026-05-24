package vn.acme.paperless_meeting.service.meetingparticipant;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddParticipantRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddGuestRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddAttendeesRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateInviteStatusRequest;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.UpdateAttendanceStatusRequest;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.ParticipantResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.GuestResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.MeetingAttendeesResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeStatisticsResponse;
import vn.acme.paperless_meeting.dto.response.meeting.PublicMeetingInviteResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.AttendanceLog;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.meetingparticipant.MeetingParticipantMapper;
import vn.acme.paperless_meeting.mapper.meetingparticipant.MeetingGuestMapper;
import vn.acme.paperless_meeting.mapper.meeting.MeetingMapper;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.repository.AttendanceLogRepository;
import vn.acme.paperless_meeting.repository.VoteEligibilityRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.document.DocumentService;
import vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse;
import java.util.stream.Collectors;
import vn.acme.paperless_meeting.repository.MeetingInvitationRepository;
import vn.acme.paperless_meeting.repository.NotificationRepository;
import vn.acme.paperless_meeting.entity.MeetingInvitation;
import vn.acme.paperless_meeting.entity.Notification;
import vn.acme.paperless_meeting.entity.enums.NotificationType;
import vn.acme.paperless_meeting.entity.enums.NotificationStatus;
import vn.acme.paperless_meeting.entity.enums.SendStatus;
import vn.acme.paperless_meeting.dto.request.meetingparticipant.SendInvitationsRequest;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingParticipantService {

    MeetingParticipantRepository meetingParticipantRepository;
    MeetingGuestRepository meetingGuestRepository;
    MeetingRepository meetingRepository;
    UserRepository userRepository;
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

    static final List<MeetingStatus> ACTIVE_MEETING_STATUSES = List.of(MeetingStatus.APPROVED, MeetingStatus.UPCOMING, MeetingStatus.IN_PROGRESS);

    private Meeting getMeeting(UUID meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
    }

    private Integer calculateLateMinutes(Meeting meeting, LocalDateTime checkinTime) {
        LocalDateTime lateLimit = meeting.getStartTime().plusMinutes(
                meeting.getLateAfterMinutes() != null ? meeting.getLateAfterMinutes() : 0
        );
        if (checkinTime.isAfter(lateLimit)) {
            return (int) Duration.between(meeting.getStartTime(), checkinTime).toMinutes();
        }
        return null;
    }

    private void requireEditPermission(Meeting meeting) {
        User caller = currentUserService.getCurrentActiveUser();
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) return;
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)
                && caller.getDepartment() != null
                && caller.getDepartment().getId().equals(meeting.getDepartment().getId())) return;
        if (meeting.getCreatedBy().getId().equals(caller.getId())) return;
        throw new AppException(ErrorCode.MEETING_PARTICIPANT_MANAGEMENT_FORBIDDEN);
    }

    private void requireAttendancePermission(Meeting meeting) {
        User caller = currentUserService.getCurrentActiveUser();
        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) return;
        if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)
                && caller.getDepartment() != null
                && caller.getDepartment().getId().equals(meeting.getDepartment().getId())) return;
        if (meeting.getCreatedBy().getId().equals(caller.getId())) return;
        
        boolean isSecretaryOrChair = meetingParticipantRepository.findByMeetingIdAndUserId(meeting.getId(), caller.getId())
                .map(p -> p.getParticipantRole() == ParticipantRole.SECRETARY || p.getParticipantRole() == ParticipantRole.CHAIR)
                .orElse(false);
        if (isSecretaryOrChair) return;
        
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
        if (meeting.getRsvpDeadline() != null && LocalDateTime.now().isAfter(meeting.getRsvpDeadline())) {
            throw new AppException(ErrorCode.MEETING_RSVP_DEADLINE_EXPIRED);
        }
    }

    @Transactional
    public MeetingAttendeesResponse addAttendees(UUID meetingId, AddAttendeesRequest request) {
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

        // RÀNG BUỘC PARTICIPANT-01: Kiểm tra trùng lặp userId trong danh sách đại biểu gửi lên (tránh gửi trùng trong cùng một request)
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

            // RÀNG BUỘC PARTICIPANT-02: Kiểm tra trạng thái tài khoản của đại biểu, bắt buộc phải là ACTIVE mới được thêm vào cuộc họp
            if (user.getStatus() != vn.acme.paperless_meeting.entity.enums.UserStatus.ACTIVE) {
                throw new AppException(ErrorCode.USER_NOT_ACTIVE);
            }

            meetingParticipantRepository.save(participant);
            responses.add(meetingParticipantMapper.toResponse(participant));
            
            auditLogPublisher.publish(
                    currentUserService.getCurrentActiveUser(),
                    AuditAction.ADD_PARTICIPANT,
                    ResourceType.PARTICIPANT,
                    participant.getId(),
                    Map.of("meetingId", String.valueOf(meetingId), "type", "INTERNAL", "userId", String.valueOf(request.getUserId()))
            );
        }

        // Validate chair count limit
        long chairCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR);
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
                    Map.of("meetingId", String.valueOf(meetingId), "type", "GUEST", "email", String.valueOf(request.getEmail()))
            );
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public MeetingAttendeesResponse getAttendees(UUID meetingId) {
        meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
        List<MeetingGuest> guests = meetingGuestRepository.findByMeetingId(meetingId);

        // O(N): Xây dựng Map lookup để tìm người thật mà mỗi substitute đang đại diện cho,
        // thay vì lồng 2 vòng for (O(N²)) cho mỗi participant/guest.
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
                        (existing, duplicate) -> existing
                ));

        List<ParticipantResponse> participantResponses = new ArrayList<>();
        List<GuestResponse> guestResponses = new ArrayList<>();

        // 1. Map thành viên nội bộ với O(1) lookup
        for (MeetingParticipant p : participants) {
            ParticipantResponse resp = meetingParticipantMapper.toResponse(p);
            MeetingParticipant original = substituteUserIdToOriginal.get(p.getUser().getId());
            if (original != null) {
                resp.setSubstitutedForUserName(original.getUser().getFullName());
                resp.setSubstitutedForUserPosition(original.getUser().getPosition() != null
                        ? original.getUser().getPosition().getPositionName() : "");
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
                            ? original.getUser().getPosition().getPositionName() : "");
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
            // Check trùng lịch bận (ACCEPTED ở cuộc họp APPROVED, UPCOMING, IN_PROGRESS khác)
            boolean overlap = meetingParticipantRepository.hasOverlapConflict(
                    userId, InviteStatus.ACCEPTED, meetingId, ACTIVE_MEETING_STATUSES, meeting.getStartTime(), meeting.getEndTime()
            );
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

            String msg = String.format("Cảnh báo: Đại biểu %s đã đổi ý từ ĐỒNG Ý thành TỪ CHỐI tham dự cuộc họp \"%s\".", 
                participant.getUser().getFullName(), meeting.getTitle());

            for (MeetingParticipant chairObj : chairs) {
                Notification notification = new Notification();
                notification.setUser(chairObj.getUser());
                notification.setType(NotificationType.RSVP_ALERT);
                notification.setStatus(NotificationStatus.PENDING);
                notification.setChannel(vn.acme.paperless_meeting.entity.enums.ChannelType.APP);
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
            if (request.getSubstituteUserId() != null) {
                User substitute = userRepository.findById(request.getSubstituteUserId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
                participant.setSubstituteUser(substitute);

                // Auto register internal substitute as participant if not already registered
                boolean isAlreadyParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, request.getSubstituteUserId());
                if (!isAlreadyParticipant) {
                    MeetingParticipant newParticipant = new MeetingParticipant();
                    newParticipant.setMeeting(meeting);
                    newParticipant.setUser(substitute);
                    newParticipant.setParticipantRole(ParticipantRole.PARTICIPANT);
                    newParticipant.setInviteStatus(InviteStatus.PENDING);
                    newParticipant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);
                    meetingParticipantRepository.save(newParticipant);
                }
            } else {
                participant.setSubstituteUser(null);
            }
            participant.setSubstituteName(request.getSubstituteName());
            participant.setSubstitutePosition(request.getSubstitutePosition());
            participant.setSubstituteCompany(request.getSubstituteCompany());
            participant.setSubstituteDepartment(request.getSubstituteDepartment());
            participant.setSubstituteEmail(request.getSubstituteEmail());
            participant.setSubstitutePhone(request.getSubstitutePhone());

            // Auto register external substitute as MeetingGuest if email is provided
            if (request.getSubstituteEmail() != null && !request.getSubstituteEmail().isEmpty()) {
                boolean isAlreadyGuest = meetingGuestRepository.existsByMeetingIdAndEmail(meetingId, request.getSubstituteEmail());
                if (!isAlreadyGuest) {
                    MeetingGuest guest = MeetingGuest.builder()
                            .meeting(meeting)
                            .fullName(request.getSubstituteName())
                            .email(request.getSubstituteEmail())
                            .phone(request.getSubstitutePhone())
                            .company(request.getSubstituteCompany())
                            .position(request.getSubstitutePosition())
                            .description("Thay thế cho đại biểu " + (participant.getUser() != null ? participant.getUser().getFullName() : ""))
                            .rsvpToken(UUID.randomUUID())
                            .guestToken(null)
                            .inviteStatus(InviteStatus.PENDING)
                            .attendanceStatus(AttendanceStatus.NOT_CHECKED_IN)
                            .build();
                    meetingGuestRepository.save(guest);
                }
            }
        } else {
            // Clean if ACCEPTED or PENDING
            participant.setDeclineReason(null);
            participant.setSubstituteUser(null);
            participant.setSubstituteName(null);
            participant.setSubstitutePosition(null);
            participant.setSubstituteCompany(null);
            participant.setSubstituteDepartment(null);
            participant.setSubstituteEmail(null);
            participant.setSubstitutePhone(null);
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
                    guest.getEmail(), InviteStatus.ACCEPTED, meeting.getId(), ACTIVE_MEETING_STATUSES, meeting.getStartTime(), meeting.getEndTime()
            );
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

    @Transactional(readOnly = true)
    public MeetingResponse publicGetMeetingByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        // Khách mời phải ACCEPTED mới được xem chi tiết cuộc họp
        if (guest.getInviteStatus() != InviteStatus.ACCEPTED) {
            throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
        }

        return meetingMapper.toResponse(guest.getMeeting());
    }

    @Transactional(readOnly = true)
    public List<MeetingDocumentResponse> publicGetMeetingDocumentsByGuestToken(UUID guestToken) {
        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        if (guest.getInviteStatus() != InviteStatus.ACCEPTED) {
            throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
        }

        // Lấy toàn bộ tài liệu của cuộc họp này ra
        List<MeetingDocumentResponse> documents = documentService.getMeetingDocuments(guest.getMeeting().getId());
        // Lọc bỏ các tài liệu mật (isConfidential = true) để khách mời không thể xem hoặc tải về
        return documents.stream()
                .filter(doc -> doc.getIsConfidential() == null || !doc.getIsConfidential())
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendeeResponse updateAttendanceStatus(UUID meetingId, UUID attendeeId, String type, UpdateAttendanceStatusRequest request) {
        Meeting meeting = getMeeting(meetingId);
        requireAttendancePermission(meeting);

        if (meeting.getStatus() == MeetingStatus.CLOSED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED);
        }

        LocalDateTime now = LocalDateTime.now();
        Integer lateMinutes = calculateLateMinutes(meeting, now);

        if ("INTERNAL".equalsIgnoreCase(type)) {
            MeetingParticipant participant = meetingParticipantRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (!participant.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            if (participant.getInviteStatus() != InviteStatus.ACCEPTED) {
                throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
            }

            participant.setAttendanceStatus(request.getAttendanceStatus());
            meetingParticipantRepository.save(participant);

            if (request.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                // Ghi nhận log điểm danh
                AttendanceLog log = attendanceLogRepository.findByMeetingIdAndUserId(meetingId, participant.getUser().getId())
                        .orElse(new AttendanceLog());
                log.setMeeting(meeting);
                log.setUser(participant.getUser());
                log.setCheckinTime(now);
                log.setStatus(AttendanceStatus.PRESENT);
                log.setLateMinutes(lateMinutes);
                log.setNote(request.getNote());
                log.setRecordedBy(currentUserService.getCurrentActiveUser());
                attendanceLogRepository.save(log);
            } else {
                // Nếu đánh dấu vắng mặt/lý do khác, cập nhật log (nếu có)
                attendanceLogRepository.findByMeetingIdAndUserId(meetingId, participant.getUser().getId())
                        .ifPresent(log -> {
                            log.setStatus(request.getAttendanceStatus());
                            attendanceLogRepository.save(log);
                        });
            }

            return meetingParticipantMapper.toAttendeeResponse(participant);


        } else {
            MeetingGuest guest = meetingGuestRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            if (!guest.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            if (guest.getInviteStatus() != InviteStatus.ACCEPTED) {
                throw new AppException(ErrorCode.PARTICIPANT_STATUS_INCONSISTENT);
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
                log.setRecordedBy(currentUserService.getCurrentActiveUser());
                attendanceLogRepository.save(log);
            } else {
                 attendanceLogRepository.findByMeetingIdAndGuestId(meetingId, guest.getId())
                        .ifPresent(log -> {
                            log.setStatus(request.getAttendanceStatus());
                            attendanceLogRepository.save(log);
                        });
            }

            return meetingGuestMapper.toAttendeeResponse(guest);
        }
    }

    @Transactional
    public void removeAttendee(UUID meetingId, UUID attendeeId, String type) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);
        validateMeetingStateForParticipantMod(meeting);

        if ("INTERNAL".equalsIgnoreCase(type)) {
            MeetingParticipant participant = meetingParticipantRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            // RÀNG BUỘC PARTICIPANT-06 & 07: Không cho phép xoá Chủ tọa (CHAIR) hoặc Thư ký (SECRETARY) cuối cùng của cuộc họp để tránh lỗi mồ côi
            if (participant.getParticipantRole() == ParticipantRole.CHAIR) {
                long chairCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.CHAIR);
                if (chairCount <= 1) {
                    throw new AppException(ErrorCode.MEETING_CHAIR_REQUIRED);
                }
            } else if (participant.getParticipantRole() == ParticipantRole.SECRETARY) {
                long secretaryCount = meetingParticipantRepository.countByMeetingIdAndParticipantRole(meetingId, ParticipantRole.SECRETARY);
                if (secretaryCount <= 1) {
                    throw new AppException(ErrorCode.MEETING_SECRETARY_REQUIRED);
                }
            }

            meetingParticipantRepository.delete(participant);

            // RÀNG BUỘC PARTICIPANT-12: Khi xoá đại biểu, thu hồi quyền biểu quyết (VoteEligibility) của họ đối với các biểu quyết chưa kết thúc
            if (voteEligibilityRepository != null && participant.getUser() != null) {
                voteEligibilityRepository.revokeVoteEligibility(meetingId, participant.getUser().getId(), "Đã bị loại khỏi cuộc họp");
            }

            auditLogPublisher.publish(
                    currentUserService.getCurrentActiveUser(),
                    AuditAction.REMOVE_PARTICIPANT,
                    ResourceType.PARTICIPANT,
                    attendeeId,
                    Map.of("meetingId", String.valueOf(meetingId), "type", "INTERNAL")
            );
        } else {
            MeetingGuest guest = meetingGuestRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
            meetingGuestRepository.delete(guest);

            auditLogPublisher.publish(
                    currentUserService.getCurrentActiveUser(),
                    AuditAction.REMOVE_PARTICIPANT,
                    ResourceType.PARTICIPANT,
                    attendeeId,
                    Map.of("meetingId", String.valueOf(meetingId), "type", "GUEST")
            );
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

        // RÀNG BUỘC INVITE-03: Tính năng chống lưu nháp (dùng list user/guest mới nhất trong DB)
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
            // RÀNG BUỘC INVITE-02: Chống gửi lặp thư mời (ngoại trừ admin ép gửi lại - forceResend = true)
            if (!forceResend) {
                boolean alreadySent = meetingInvitationRepository.existsByMeetingIdAndInviteeUserIdAndSendStatus(
                        meetingId, p.getUser().getId(), SendStatus.SENT);
                if (alreadySent) continue;
            }

            MeetingInvitation invitation = new MeetingInvitation();
            invitation.setMeeting(meeting);
            invitation.setInviteeUser(p.getUser());
            invitation.setChannel(vn.acme.paperless_meeting.entity.enums.ChannelType.EMAIL);
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
                if (alreadySent) continue;
            }

            MeetingInvitation invitation = new MeetingInvitation();
            invitation.setMeeting(meeting);
            invitation.setInviteeGuest(g);
            invitation.setChannel(vn.acme.paperless_meeting.entity.enums.ChannelType.EMAIL);
            invitation.setSendStatus(SendStatus.SENT);
            invitation.setSentAt(now);
            invitation.setRsvpDeadline(meeting.getRsvpDeadline());
            invitation.setInvitedBy(caller);
            invitation.setMessage("Kính mời khách mời tham dự cuộc họp: " + meeting.getTitle());
            meetingInvitationRepository.save(invitation);
        }
    }
}
