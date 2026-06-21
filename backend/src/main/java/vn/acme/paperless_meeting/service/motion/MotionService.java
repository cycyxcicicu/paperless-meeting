package vn.acme.paperless_meeting.service.motion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.motion.MotionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.dto.response.motion.VoteStatisticsResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.Motion;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.VoteBallot;
import vn.acme.paperless_meeting.entity.VoteBallotChoice;
import vn.acme.paperless_meeting.entity.VoteOption;
import vn.acme.paperless_meeting.entity.VoteSession;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.MotionStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.VoteSessionStatus;
import vn.acme.paperless_meeting.entity.enums.VoteType;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import java.util.Map;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.motion.MotionMapper;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MotionRepository;
import vn.acme.paperless_meeting.repository.VoteBallotChoiceRepository;
import vn.acme.paperless_meeting.repository.VoteBallotRepository;
import vn.acme.paperless_meeting.repository.VoteOptionRepository;
import vn.acme.paperless_meeting.repository.VoteSessionRepository;
import vn.acme.paperless_meeting.repository.VoteEligibilityRepository;
import vn.acme.paperless_meeting.repository.VoteResultRepository;
import vn.acme.paperless_meeting.repository.VoteResultOptionRepository;
import vn.acme.paperless_meeting.entity.VoteResult;
import vn.acme.paperless_meeting.entity.VoteResultOption;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MotionService {

    MotionRepository motionRepository;
    AgendaItemRepository agendaItemRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    MeetingGuestRepository meetingGuestRepository;
    VoteSessionRepository voteSessionRepository;
    VoteOptionRepository voteOptionRepository;
    VoteBallotRepository voteBallotRepository;
    VoteBallotChoiceRepository voteBallotChoiceRepository;
    VoteEligibilityRepository voteEligibilityRepository;
    VoteResultRepository voteResultRepository;
    VoteResultOptionRepository voteResultOptionRepository;
    CurrentUserService currentUserService;
    MotionMapper motionMapper;
    AuditLogPublisher auditLogPublisher;
    WebSocketNotificationService webSocketNotificationService;

    /**
     * Tạo mới một vấn đề biểu quyết
     */
    @Transactional
    public MotionResponse createMotion(UUID agendaItemId, MotionUpsertRequest request) {
        AgendaItem agendaItem = agendaItemRepository.findById(agendaItemId)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        Meeting meeting = agendaItem.getMeeting();
        User caller = currentUserService.getCurrentActiveUser();

        // Kiểm tra phân quyền và trạng thái cuộc họp
        if (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED) {
            // Trước cuộc họp: Chỉ người tạo cuộc họp mới được tạo
            if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
                throw new AppException(ErrorCode.MOTION_MODIFICATION_FORBIDDEN);
            }
        } else if (meeting.getStatus() == MeetingStatus.IN_PROGRESS) {
            // Trong cuộc họp: Chỉ Chủ tọa (CHAIR) mới được tạo biểu quyết phát sinh
            boolean isChair = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                    meeting.getId(), caller.getId(), ParticipantRole.CHAIR);
            if (!isChair) {
                throw new AppException(ErrorCode.MOTION_MODIFICATION_FORBIDDEN);
            }
        } else {
            // Các trạng thái khác (đang duyệt, sắp diễn ra, đã kết thúc, đã hủy...): Không được tạo
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        Motion motion = motionMapper.toEntity(request);
        motion.setAgendaItem(agendaItem);
        motion.setMeeting(meeting);
        motion.setCreatedBy(caller);
        motion.setStatus(MotionStatus.DRAFT);
        motion.setCreatedAt(LocalDateTime.now());
        Motion savedMotion = motionRepository.save(motion);

        auditLogPublisher.publish(
                caller,
                AuditAction.CREATE_MOTION,
                ResourceType.MOTION,
                savedMotion.getId(),
                Map.of(
                        "title", String.valueOf(savedMotion.getTitle()),
                        "description", String.valueOf(savedMotion.getDescription())
                )
        );

        return motionMapper.toResponse(savedMotion);
    }

    /**
     * Cập nhật vấn đề biểu quyết
     */
    @Transactional
    public MotionResponse updateMotion(UUID id, MotionUpsertRequest request) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        Meeting meeting = motion.getMeeting();
        User caller = currentUserService.getCurrentActiveUser();

        // Kiểm tra phân quyền theo trạng thái cuộc họp
        if (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED) {
            if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
                throw new AppException(ErrorCode.MOTION_MODIFICATION_FORBIDDEN);
            }
        } else if (meeting.getStatus() == MeetingStatus.IN_PROGRESS) {
            boolean isChair = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                    meeting.getId(), caller.getId(), ParticipantRole.CHAIR);
            if (!isChair) {
                throw new AppException(ErrorCode.MOTION_MODIFICATION_FORBIDDEN);
            }
        } else {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        // Chặn sửa khi biểu quyết đã hoặc đang diễn ra
        if (motion.getStatus() == MotionStatus.SUBMITTED || motion.getStatus() == MotionStatus.CLOSED) {
            throw new AppException(ErrorCode.MOTION_ALREADY_VOTED);
        }

        motionMapper.updateEntity(request, motion);
        Motion savedMotion = motionRepository.save(motion);

        auditLogPublisher.publish(
                caller,
                AuditAction.UPDATE_MOTION,
                ResourceType.MOTION,
                savedMotion.getId(),
                Map.of(
                        "title", String.valueOf(savedMotion.getTitle()),
                        "description", String.valueOf(savedMotion.getDescription())
                )
        );

        return motionMapper.toResponse(savedMotion);
    }

    /**
     * Xóa vấn đề biểu quyết
     */
    @Transactional
    public void deleteMotion(UUID id) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        Meeting meeting = motion.getMeeting();
        User caller = currentUserService.getCurrentActiveUser();

        // Kiểm tra phân quyền theo trạng thái cuộc họp
        if (meeting.getStatus() == MeetingStatus.DRAFT || meeting.getStatus() == MeetingStatus.REJECTED) {
            if (meeting.getCreatedBy() == null || !meeting.getCreatedBy().getId().equals(caller.getId())) {
                throw new AppException(ErrorCode.MOTION_MODIFICATION_FORBIDDEN);
            }
        } else if (meeting.getStatus() == MeetingStatus.IN_PROGRESS) {
            boolean isChair = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                    meeting.getId(), caller.getId(), ParticipantRole.CHAIR);
            if (!isChair) {
                throw new AppException(ErrorCode.MOTION_MODIFICATION_FORBIDDEN);
            }
        } else {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        // Chặn xóa khi biểu quyết đã hoặc đang diễn ra
        if (motion.getStatus() == MotionStatus.SUBMITTED || motion.getStatus() == MotionStatus.CLOSED) {
            throw new AppException(ErrorCode.MOTION_ALREADY_VOTED);
        }

        motionRepository.delete(motion);

        auditLogPublisher.publish(
                caller,
                AuditAction.DELETE_MOTION,
                ResourceType.MOTION,
                motion.getId(),
                Map.of(
                        "title", String.valueOf(motion.getTitle()),
                        "description", String.valueOf(motion.getDescription())
                )
        );
    }

    /**
     * Lấy danh sách vấn đề biểu quyết của đầu mục chương trình
     */
    public List<MotionResponse> getMotions(UUID agendaItemId) {
        agendaItemRepository.findById(agendaItemId)
                .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

        List<Motion> list = motionRepository.findByAgendaItemIdWithCreator(agendaItemId);
        return list.stream()
                .map(m -> {
                    MotionResponse resp = motionMapper.toResponse(m);
                    enrichMotionResponse(resp, m);
                    return resp;
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách vấn đề biểu quyết của toàn bộ cuộc họp
     */
    public List<MotionResponse> getMeetingMotions(UUID meetingId) {
        List<Motion> list = motionRepository.findByMeetingId(meetingId);
        return list.stream()
                .map(m -> {
                    MotionResponse resp = motionMapper.toResponse(m);
                    enrichMotionResponse(resp, m);
                    return resp;
                })
                .collect(Collectors.toList());
    }

    private void enrichMotionResponse(MotionResponse resp, Motion motion) {
        if (resp == null || motion == null) return;
        VoteSession activeSession = motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN)
                .findFirst()
                .orElse(null);
        if (activeSession == null) {
            resp.setHasVoted(false);
            return;
        }

        User user = null;
        try {
            user = currentUserService.getCurrentActiveUser();
        } catch (Exception ignored) {}

        if (user != null) {
            boolean hasVoted = voteBallotRepository.existsByVoteSessionIdAndUserId(activeSession.getId(), user.getId());
            resp.setHasVoted(hasVoted);
        } else {
            resp.setHasVoted(false);
        }
    }

    private void enrichMotionResponseForGuest(MotionResponse resp, Motion motion, MeetingGuest guest) {
        if (resp == null || motion == null || guest == null) return;
        VoteSession activeSession = motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN)
                .findFirst()
                .orElse(null);
        if (activeSession == null) {
            resp.setHasVoted(false);
            return;
        }
        boolean hasVoted = voteBallotRepository.existsByVoteSessionIdAndGuestId(activeSession.getId(), guest.getId());
        resp.setHasVoted(hasVoted);
    }

    @Transactional(readOnly = true)
    public List<MotionResponse> getMeetingMotionsForGuest(UUID meetingId, MeetingGuest guest) {
        List<Motion> list = motionRepository.findByMeetingId(meetingId);
        return list.stream()
                .map(m -> {
                    MotionResponse resp = motionMapper.toResponse(m);
                    enrichMotionResponseForGuest(resp, m, guest);
                    return resp;
                })
                .collect(Collectors.toList());
    }

    /**
     * (Trong phiên họp) Chủ trì phát lệnh bắt đầu biểu quyết cho vấn đề này
     */
    @Transactional
    public MotionResponse startVote(UUID id, Integer durationMinutes) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        Meeting meeting = motion.getMeeting();
        User caller = currentUserService.getCurrentActiveUser();

        // Phải là chủ tọa (CHAIR) mới được phát lệnh biểu quyết
        boolean isChair = meetingParticipantRepository.findByMeetingIdAndUserId(meeting.getId(), caller.getId())
                .map(p -> p.getParticipantRole() == ParticipantRole.CHAIR)
                .orElse(false);
        if (!isChair) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        // Chỉ được biểu quyết khi cuộc họp đang diễn ra (IN_PROGRESS)
        if (meeting.getStatus() != MeetingStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }

        // Tạo mới một phiên biểu quyết (YES_NO)
        VoteSession session = new VoteSession();
        session.setOpenedAt(LocalDateTime.now());
        session.setStatus(VoteSessionStatus.OPEN);
        session.setVoteType(VoteType.YES_NO);
        session.setIsAnonymous(false);
        session.setAllowChangeVote(false);
        session.setMeeting(meeting);
        session.setMotion(motion);
        session.setCreatedBy(caller);
        session.setDurationMinutes(durationMinutes);
        VoteSession savedSession = voteSessionRepository.save(session);

        // Tạo 2 Option CÓ / KHÔNG
        VoteOption optYes = new VoteOption();
        optYes.setLabel("CÓ");
        optYes.setOrderNo(1);
        optYes.setVoteSession(savedSession);
        voteOptionRepository.save(optYes);

        VoteOption optNo = new VoteOption();
        optNo.setLabel("KHÔNG");
        optNo.setOrderNo(2);
        optNo.setVoteSession(savedSession);
        voteOptionRepository.save(optNo);

        motion.setStatus(MotionStatus.SUBMITTED);
        Motion savedMotion = motionRepository.save(motion);

        auditLogPublisher.publish(
                caller,
                AuditAction.OPEN_VOTE,
                ResourceType.MOTION,
                savedMotion.getId(),
                Map.of(
                        "durationMinutes", String.valueOf(durationMinutes)
                )
        );

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meeting.getId() + "/motions", Map.of(
                "action", "START_VOTE",
                "motionId", savedMotion.getId().toString(),
                "motionTitle", savedMotion.getTitle() != null ? savedMotion.getTitle() : ""
        ));

        return motionMapper.toResponse(savedMotion);
    }

    /**
     * Chủ trì kết thúc biểu quyết
     */
    @Transactional
    public MotionResponse stopVote(UUID id) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        Meeting meeting = motion.getMeeting();
        User caller = currentUserService.getCurrentActiveUser();

        boolean isChair = meetingParticipantRepository.findByMeetingIdAndUserId(meeting.getId(), caller.getId())
                .map(p -> p.getParticipantRole() == ParticipantRole.CHAIR)
                .orElse(false);
        if (!isChair) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        // Tìm phiên biểu quyết đang mở của Motion
        VoteSession activeSession = motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        // Kiểm tra xem phiên biểu quyết có bị hết thời gian hay chưa
        if (activeSession.getOpenedAt() != null && activeSession.getDurationMinutes() != null) {
            LocalDateTime expireTime = activeSession.getOpenedAt().plusMinutes(activeSession.getDurationMinutes());
            if (LocalDateTime.now().isAfter(expireTime)) {
                // Đã quá giờ thì vẫn tiếp tục update trạng thái CLOSED
            }
        }

        completeVoteSessionInternal(activeSession, LocalDateTime.now());

        auditLogPublisher.publish(
                caller,
                AuditAction.CLOSE_VOTE,
                ResourceType.MOTION,
                motion.getId(),
                Map.of(
                        "title", String.valueOf(motion.getTitle())
                )
        );

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meeting.getId() + "/motions", Map.of(
                "action", "STOP_VOTE",
                "motionId", motion.getId().toString(),
                "motionTitle", motion.getTitle() != null ? motion.getTitle() : ""
        ));

        return motionMapper.toResponse(motionRepository.findById(id).orElseThrow());
    }

    @Transactional
    public void completeVoteSession(VoteSession session) {
        completeVoteSessionInternal(session, LocalDateTime.now());

        // Gửi WebSocket thông báo cho tất cả client khi job tự động đóng phiên biểu quyết hết hạn
        Motion motion = session.getMotion();
        if (motion != null && motion.getMeeting() != null) {
            webSocketNotificationService.sendToTopic(
                    "/topic/meeting/" + motion.getMeeting().getId() + "/motions",
                    Map.of(
                            "action", "STOP_VOTE",
                            "motionId", motion.getId().toString(),
                            "motionTitle", motion.getTitle() != null ? motion.getTitle() : ""
                    )
            );
        }
    }

    private void completeVoteSessionInternal(VoteSession activeSession, LocalDateTime closeTime) {
        if (activeSession.getStatus() == VoteSessionStatus.CLOSED) return;

        activeSession.setClosedAt(closeTime);
        activeSession.setStatus(VoteSessionStatus.CLOSED);
        voteSessionRepository.save(activeSession);

        Motion motion = activeSession.getMotion();
        if (motion != null) {
            motion.setStatus(MotionStatus.CLOSED);
            motionRepository.save(motion);
        }

        // 1. Lưu VoteResult
        VoteStatisticsResponse stats = getVoteStatisticsInternal(activeSession, motion);
        VoteResult result = new VoteResult();
        result.setId(activeSession.getId());
        result.setVoteSession(activeSession);
        result.setTotalEligible((long) stats.getTotalVoters());
        result.setTotalCast((long) stats.getVotedCount());
        result.setTotalValid((long) stats.getVotedCount());
        result.setPassed(stats.getYesCount() > stats.getNoCount());
        result.setComputedAt(LocalDateTime.now());
        try {
            result.setComputedBy(currentUserService.getCurrentActiveUser());
        } catch (Exception e) {
            // Có thể null nếu gọi từ background job
        }
        voteResultRepository.save(result);

        // 2. Lưu VoteResultOption
        List<VoteOption> options = voteOptionRepository.findByVoteSessionIdOrderByOrderNoAsc(activeSession.getId());
        for (VoteOption option : options) {
            long count = voteBallotChoiceRepository.countValidChoicesByOption(option.getId());
            VoteResultOption vro = new VoteResultOption();
            vro.setVoteSession(activeSession);
            vro.setOption(option);
            vro.setVoteCount(count);
            vro.setWeightSum(java.math.BigDecimal.valueOf(count));
            voteResultOptionRepository.save(vro);
        }
    }

    /**
     * Đại biểu thực hiện biểu quyết (Cast Vote)
     */
    @Transactional
    public MotionResponse castVote(UUID id, UUID optionId) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        // 1. Tìm phiên biểu quyết đang mở của Motion
        VoteSession activeSession = motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        // 2. Kiểm tra xem phiên biểu quyết có bị hết thời gian hay chưa
        if (activeSession.getOpenedAt() != null && activeSession.getDurationMinutes() != null) {
            LocalDateTime expireTime = activeSession.getOpenedAt().plusMinutes(activeSession.getDurationMinutes());
            if (LocalDateTime.now().isAfter(expireTime)) {
                // Fix bug: Không save rồi throw (toàn bộ transaction sẽ bị rollback, save vô nghĩa).
                // Chỉ throw — VoteStatusJob chạy mỗi 5 giây sẽ tự dọn và đóng phiên.
                throw new AppException(ErrorCode.VOTE_SESSION_CLOSED);
            }
        }

        User caller = currentUserService.getCurrentActiveUser();

        // Kiểm tra xem đại biểu đã tham gia cuộc họp và ĐÃ ĐIỂM DANH (PRESENT) chưa
        MeetingParticipant participant = meetingParticipantRepository.findByMeetingIdAndUserId(motion.getMeeting().getId(), caller.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PARTICIPANT_NOT_PRESENT));

        if (participant.getAttendanceStatus() != AttendanceStatus.PRESENT) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_PRESENT);
        }

        // Chỉ có SECRETARY bị loại trừ khỏi quyền biểu quyết
        if (participant.getParticipantRole() == ParticipantRole.SECRETARY) {
            throw new AppException(ErrorCode.VOTE_ROLE_NOT_ALLOWED);
        }

        // Kiểm tra xem đại biểu có báo vắng cho nội dung này không
        boolean isAbsent = false;
        UUID agendaItemId = motion.getAgendaItem() != null ? motion.getAgendaItem().getId() : null;
        if (participant.getInviteStatus() == InviteStatus.DECLINED) {
            if (participant.getIsFullSession() == null || participant.getIsFullSession()) {
                isAbsent = true;
            } else if (agendaItemId != null && participant.getAbsentAgendaItemIds() != null 
                    && participant.getAbsentAgendaItemIds().contains(agendaItemId)) {
                isAbsent = true;
            }
        }
        if (isAbsent) {
            throw new AppException(ErrorCode.VOTE_ROLE_NOT_ALLOWED);
        }

        // Nếu đại biểu là người đi thay (isSubstitute), kiểm tra xem đại biểu gốc có báo vắng ở nội dung này không
        if (Boolean.TRUE.equals(participant.getIsSubstitute()) && participant.getSubstituteForParticipantId() != null) {
            MeetingParticipant originalParticipant = meetingParticipantRepository.findById(participant.getSubstituteForParticipantId())
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            boolean originalAbsent = false;
            if (originalParticipant.getInviteStatus() == InviteStatus.DECLINED) {
                if (originalParticipant.getIsFullSession() == null || originalParticipant.getIsFullSession()) {
                    originalAbsent = true;
                } else if (agendaItemId != null && originalParticipant.getAbsentAgendaItemIds() != null 
                        && originalParticipant.getAbsentAgendaItemIds().contains(agendaItemId)) {
                    originalAbsent = true;
                }
            }
            if (!originalAbsent) {
                throw new AppException(ErrorCode.VOTE_ROLE_NOT_ALLOWED);
            }
        }

        // Kiểm tra Whitelist (VoteEligibility)
        long eligibilityCount = voteEligibilityRepository.countByVoteSessionId(activeSession.getId());
        if (eligibilityCount > 0) {
            boolean isEligible = voteEligibilityRepository.existsByVoteSessionIdAndUserIdAndEligibleTrue(activeSession.getId(), caller.getId());
            if (!isEligible) {
                throw new AppException(ErrorCode.VOTE_ROLE_NOT_ALLOWED);
            }
        }

        // 3. Kiểm tra xem người dùng này đã biểu quyết chưa (chống vote trùng)
        boolean alreadyVoted = voteBallotRepository.existsByVoteSessionIdAndUserId(activeSession.getId(), caller.getId());
        if (alreadyVoted) {
            throw new AppException(ErrorCode.VOTE_ALREADY_CAST);
        }

        // 4. Kiểm tra xem Option có thuộc VoteSession này hay không
        VoteOption option = voteOptionRepository.findById(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));
        if (!option.getVoteSession().getId().equals(activeSession.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        // 5. Tạo và lưu Ballot
        VoteBallot ballot = new VoteBallot();
        ballot.setVoteSession(activeSession);
        ballot.setUser(caller);
        ballot.setCastAt(LocalDateTime.now());
        ballot.setWeight(java.math.BigDecimal.ONE);
        ballot.setIsValid(true);
        VoteBallot savedBallot = voteBallotRepository.save(ballot);

        // 6. Tạo và lưu Ballot Choice
        VoteBallotChoice choice = new VoteBallotChoice();
        choice.setBallot(savedBallot);
        choice.setOption(option);
        voteBallotChoiceRepository.save(choice);

        auditLogPublisher.publish(
                caller,
                AuditAction.CAST_VOTE,
                ResourceType.MOTION,
                motion.getId(),
                Map.of(
                        "optionLabel", String.valueOf(option.getLabel())
                )
        );

        webSocketNotificationService.sendToTopic("/topic/meeting/" + motion.getMeeting().getId() + "/motions", Map.of(
                "action", "CAST_VOTE",
                "motionId", motion.getId().toString()
        ));

        return motionMapper.toResponse(motion);
    }

    @Transactional
    public MotionResponse publicCastVote(UUID id, UUID optionId, UUID guestToken) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        VoteSession activeSession = motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (activeSession.getOpenedAt() != null && activeSession.getDurationMinutes() != null) {
            LocalDateTime expireTime = activeSession.getOpenedAt().plusMinutes(activeSession.getDurationMinutes());
            if (LocalDateTime.now().isAfter(expireTime)) {
                throw new AppException(ErrorCode.VOTE_SESSION_CLOSED);
            }
        }

        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        if (!guest.getMeeting().getId().equals(motion.getMeeting().getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        if (guest.getAttendanceStatus() != AttendanceStatus.PRESENT) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_PRESENT);
        }

        if (!Boolean.TRUE.equals(guest.getIsSubstitute()) || guest.getSubstituteForParticipantId() == null) {
            throw new AppException(ErrorCode.VOTE_ROLE_NOT_ALLOWED);
        }

        UUID agendaItemId = motion.getAgendaItem() != null ? motion.getAgendaItem().getId() : null;
        MeetingParticipant originalParticipant = meetingParticipantRepository.findById(guest.getSubstituteForParticipantId())
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        boolean originalAbsent = false;
        if (originalParticipant.getInviteStatus() == InviteStatus.DECLINED) {
            if (originalParticipant.getIsFullSession() == null || originalParticipant.getIsFullSession()) {
                originalAbsent = true;
            } else if (agendaItemId != null && originalParticipant.getAbsentAgendaItemIds() != null 
                    && originalParticipant.getAbsentAgendaItemIds().contains(agendaItemId)) {
                originalAbsent = true;
            }
        }

        if (!originalAbsent) {
            throw new AppException(ErrorCode.VOTE_ROLE_NOT_ALLOWED);
        }

        boolean alreadyVoted = voteBallotRepository.existsByVoteSessionIdAndGuestId(activeSession.getId(), guest.getId());
        if (alreadyVoted) {
            throw new AppException(ErrorCode.VOTE_ALREADY_CAST);
        }

        VoteOption option = voteOptionRepository.findById(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));
        if (!option.getVoteSession().getId().equals(activeSession.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        VoteBallot ballot = new VoteBallot();
        ballot.setVoteSession(activeSession);
        ballot.setGuest(guest);
        ballot.setCastAt(LocalDateTime.now());
        ballot.setWeight(java.math.BigDecimal.ONE);
        ballot.setIsValid(true);
        VoteBallot savedBallot = voteBallotRepository.save(ballot);

        VoteBallotChoice choice = new VoteBallotChoice();
        choice.setBallot(savedBallot);
        choice.setOption(option);
        voteBallotChoiceRepository.save(choice);

        auditLogPublisher.publish(
                null,
                AuditAction.CAST_VOTE,
                ResourceType.MOTION,
                motion.getId(),
                Map.of(
                        "guestId", String.valueOf(guest.getId()),
                        "optionLabel", String.valueOf(option.getLabel())
                )
        );

        webSocketNotificationService.sendToTopic("/topic/meeting/" + motion.getMeeting().getId() + "/motions", Map.of(
                "action", "CAST_VOTE",
                "motionId", motion.getId().toString()
        ));

        MotionResponse resp = motionMapper.toResponse(motion);
        enrichMotionResponseForGuest(resp, motion, guest);
        return resp;
    }

    /**
     * Lấy thống kê biểu quyết bảo mật (không lộ danh tính cử tri)
     */
    @Transactional(readOnly = true)
    public VoteStatisticsResponse getVoteStatistics(UUID id) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        User caller = currentUserService.getCurrentActiveUser();
        
        // VOTE-12: Chỉ có người tham gia cuộc họp (Participant) mới được quyền xem kết quả VoteSession.
        boolean isParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(motion.getMeeting().getId(), caller.getId());
        if (!isParticipant) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        VoteSession session = motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN || s.getStatus() == VoteSessionStatus.CLOSED)
                .findFirst()
                .orElse(null);

        if (session == null) {
            return VoteStatisticsResponse.builder()
                    .totalVoters(0).votedCount(0).notVotedCount(0).yesCount(0).noCount(0).build();
        }

        return getVoteStatisticsInternal(session, motion);
    }

    private VoteStatisticsResponse getVoteStatisticsInternal(VoteSession session, Motion motion) {
        // 1. Tính tổng cử tri hợp lệ
        int totalVoters = 0;
        long eligibilityCount = voteEligibilityRepository.countByVoteSessionId(session.getId());
        if (eligibilityCount > 0) {
            totalVoters = (int) eligibilityCount;
        } else {
            UUID meetingId = motion.getMeeting().getId();
            List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
            UUID agendaItemId = motion.getAgendaItem() != null ? motion.getAgendaItem().getId() : null;

            for (MeetingParticipant p : participants) {
                if (p.getParticipantRole() == ParticipantRole.SECRETARY) {
                    continue;
                }

                // Check if they are absent for this specific motion
                boolean isAbsent = false;
                if (p.getInviteStatus() == InviteStatus.DECLINED) {
                    if (p.getIsFullSession() == null || p.getIsFullSession()) {
                        isAbsent = true;
                    } else if (agendaItemId != null && p.getAbsentAgendaItemIds() != null && p.getAbsentAgendaItemIds().contains(agendaItemId)) {
                        isAbsent = true;
                    }
                }

                if (isAbsent) {
                    // Check if they have a substitute registered
                    boolean hasSubstitute = false;
                    if (p.getSubstituteUser() != null) {
                        hasSubstitute = true;
                    } else if (p.getSubstituteName() != null && !p.getSubstituteName().trim().isEmpty()) {
                        hasSubstitute = true;
                    }
                    
                    if (hasSubstitute) {
                        totalVoters++;
                    }
                } else {
                    totalVoters++;
                }
            }
        }

        // 2. Số lượng người đã bỏ phiếu hợp lệ
        int votedCount = (int) voteBallotChoiceRepository.countValidBallotsBySession(session.getId());

        // 3. Số người chưa bỏ phiếu
        int notVotedCount = Math.max(0, totalVoters - votedCount);

        // 4. Đếm chi tiết vote
        int yesCount = 0;
        int noCount = 0;
        List<VoteOption> options = voteOptionRepository.findByVoteSessionIdOrderByOrderNoAsc(session.getId());
        for (VoteOption option : options) {
            long count = voteBallotChoiceRepository.countValidChoicesByOption(option.getId());
            if (Integer.valueOf(1).equals(option.getOrderNo())) yesCount = (int) count;
            else if (Integer.valueOf(2).equals(option.getOrderNo())) noCount = (int) count;
        }

        return VoteStatisticsResponse.builder()
                .totalVoters(totalVoters)
                .votedCount(votedCount)
                .notVotedCount(notVotedCount)
                .yesCount(yesCount)
                .noCount(noCount)
                .build();
    }

    /**
     * Tự động đóng tất cả các phiên biểu quyết còn mở (khi cuộc họp kết thúc)
     */
    @Transactional
    public void closeAllOpenVoteSessions(UUID meetingId) {
        List<VoteSession> openSessions = voteSessionRepository.findByMeetingIdAndStatus(meetingId, VoteSessionStatus.OPEN);
        LocalDateTime now = LocalDateTime.now();
        for (VoteSession session : openSessions) {
            completeVoteSessionInternal(session, now);
        }
    }

    @Transactional(readOnly = true)
    public VoteStatisticsResponse publicGetVoteStatistics(UUID id) {
        Motion motion = motionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOTION_NOT_FOUND));

        VoteSession session = motion.getVoteSessionList().stream()
                .filter(s -> s.getStatus() == VoteSessionStatus.OPEN || s.getStatus() == VoteSessionStatus.CLOSED)
                .findFirst()
                .orElse(null);

        if (session == null) {
            return VoteStatisticsResponse.builder()
                    .totalVoters(0).votedCount(0).notVotedCount(0).yesCount(0).noCount(0).build();
        }

        return getVoteStatisticsInternal(session, motion);
    }
}
