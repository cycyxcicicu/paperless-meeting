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
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MotionService {

    MotionRepository motionRepository;
    AgendaItemRepository agendaItemRepository;
    MeetingParticipantRepository meetingParticipantRepository;
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
                .map(motionMapper::toResponse)
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

        return motionMapper.toResponse(motionRepository.findById(id).orElseThrow());
    }

    @Transactional
    public void completeVoteSession(VoteSession session) {
        completeVoteSessionInternal(session, LocalDateTime.now());
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

        // Chỉ vai trò PARTICIPANT mới được quyền biểu quyết (CHAIR và SECRETARY không vote)
        if (participant.getParticipantRole() != ParticipantRole.PARTICIPANT) {
            throw new AppException(ErrorCode.VOTE_ROLE_NOT_ALLOWED);
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

        return motionMapper.toResponse(motion);
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
            totalVoters = (int) meetingParticipantRepository.countByMeetingIdAndParticipantRole(
                    motion.getMeeting().getId(), ParticipantRole.PARTICIPANT);
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
}
