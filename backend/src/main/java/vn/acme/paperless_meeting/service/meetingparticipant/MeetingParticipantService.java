package vn.acme.paperless_meeting.service.meetingparticipant;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.repository.AttendanceLogRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

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

    private void validateMeetingState(Meeting meeting) {
        if (meeting.getStatus() == MeetingStatus.CLOSED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new AppException(ErrorCode.MEETING_ALREADY_CLOSED_OR_CANCELLED);
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
        validateMeetingState(meeting);

        List<ParticipantResponse> responses = new ArrayList<>();
        for (AddParticipantRequest request : requests) {
            Optional<MeetingParticipant> existingOpt = meetingParticipantRepository
                    .findByMeetingIdAndUserId(meetingId, request.getUserId());

            MeetingParticipant participant;
            if (existingOpt.isPresent()) {
                participant = existingOpt.get();
                meetingParticipantMapper.updateEntity(request, participant);
            } else {
                User user = userRepository.findById(request.getUserId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

                participant = meetingParticipantMapper.toEntity(request);
                participant.setMeeting(meeting);
                participant.setUser(user);
                participant.setInviteStatus(InviteStatus.PENDING);
                participant.setAttendanceStatus(AttendanceStatus.NOT_CHECKED_IN);
            }

            meetingParticipantRepository.save(participant);
            responses.add(meetingParticipantMapper.toResponse(participant));
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
        validateMeetingState(meeting);

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
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public MeetingAttendeesResponse getAttendees(UUID meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
        List<MeetingGuest> guests = meetingGuestRepository.findByMeetingId(meetingId);

        List<ParticipantResponse> participantResponses = new ArrayList<>();
        List<GuestResponse> guestResponses = new ArrayList<>();

        // 1. Map thành viên nội bộ
        for (MeetingParticipant p : participants) {
            ParticipantResponse resp = meetingParticipantMapper.toResponse(p);
            
            // Tìm xem người này có đi thay cho ai không
            for (MeetingParticipant org : participants) {
                if (org.getSubstituteUser() != null && org.getSubstituteUser().getId().equals(p.getUser().getId())) {
                    resp.setSubstitutedForUserName(org.getUser().getFullName());
                    resp.setSubstitutedForUserPosition(org.getUser().getPosition() != null ? org.getUser().getPosition().getPositionName() : "");
                    break;
                }
            }
            participantResponses.add(resp);
        }

        // 3. Map khách ngoài
        for (MeetingGuest g : guests) {
            GuestResponse resp = meetingGuestMapper.toResponse(g);
            
            // Tìm xem khách này có đi thay cho ai không
            if (g.getEmail() != null) {
                for (MeetingParticipant org : participants) {
                    if (org.getSubstituteEmail() != null && org.getSubstituteEmail().equalsIgnoreCase(g.getEmail())) {
                        resp.setSubstitutedForUserName(org.getUser().getFullName());
                        resp.setSubstitutedForUserPosition(org.getUser().getPosition() != null ? org.getUser().getPosition().getPositionName() : "");
                        break;
                    }
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
        validateMeetingState(meeting);

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

        participant.setInviteStatus(request.getInviteStatus());

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
        validateMeetingState(meeting);

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

    @Transactional
    public AttendeeResponse updateAttendanceStatus(UUID meetingId, UUID attendeeId, String type, UpdateAttendanceStatusRequest request) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);

        LocalDateTime now = LocalDateTime.now();
        Integer lateMinutes = calculateLateMinutes(meeting, now);

        if ("INTERNAL".equalsIgnoreCase(type)) {
            MeetingParticipant participant = meetingParticipantRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

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
            }

            return meetingParticipantMapper.toAttendeeResponse(participant);

        } else {
            MeetingGuest guest = meetingGuestRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

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
            }

            return meetingGuestMapper.toAttendeeResponse(guest);
        }
    }

    @Transactional
    public void removeAttendee(UUID meetingId, UUID attendeeId, String type) {
        Meeting meeting = getMeeting(meetingId);
        requireEditPermission(meeting);
        validateMeetingState(meeting);

        if ("INTERNAL".equalsIgnoreCase(type)) {
            MeetingParticipant participant = meetingParticipantRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
            meetingParticipantRepository.delete(participant);
        } else {
            MeetingGuest guest = meetingGuestRepository.findById(attendeeId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));
            meetingGuestRepository.delete(guest);
        }
    }
}
