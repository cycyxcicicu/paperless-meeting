package vn.acme.paperless_meeting.service.speaker;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.dto.request.speaker.ReorderQueueRequest;
import vn.acme.paperless_meeting.dto.request.speaker.StartDirectTurnRequest;
import vn.acme.paperless_meeting.dto.request.speaker.StartTurnRequest;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerQueueResponse;
import vn.acme.paperless_meeting.dto.response.speaker.SpeakerTurnResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.SpeakerQueue;
import vn.acme.paperless_meeting.entity.SpeakerTurn;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueuePriority;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueueStatus;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.MeetingGuestRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.SpeakerQueueRepository;
import vn.acme.paperless_meeting.repository.SpeakerTurnRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.meeting.MeetingService;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SpeakerService {

    SpeakerQueueRepository speakerQueueRepository;
    SpeakerTurnRepository speakerTurnRepository;
    MeetingRepository meetingRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    MeetingGuestRepository meetingGuestRepository;
    UserRepository userRepository;
    AgendaItemRepository agendaItemRepository;
    CurrentUserService currentUserService;
    AuditLogPublisher auditLogPublisher;
    WebSocketNotificationService webSocketNotificationService;

    @lombok.experimental.NonFinal
    MeetingService meetingService;

    @Autowired
    public void setMeetingService(@Lazy MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    // SPEAKER-06: Chỉ CHAIR hoặc SECRETARY mới được gọi/dừng lượt phát biểu
    private void checkIsChairOrSecretary(UUID meetingId, UUID userId) {
        boolean isChair = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                meetingId, userId, ParticipantRole.CHAIR);
        if (isChair)
            return;
        boolean isSecretary = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                meetingId, userId, ParticipantRole.SECRETARY);
        if (isSecretary)
            return;
        throw new AppException(ErrorCode.UNAUTHOZIZED);
    }

    private void checkMeetingInProgress(Meeting meeting) {
        if (meeting.getStatus() != MeetingStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.MEETING_STATUS_TRANSITION_INVALID);
        }
    }

    private void checkIsParticipant(UUID meetingId, UUID userId) {
        boolean isParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, userId);
        if (!isParticipant) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }
    }

    // 1. Đại biểu xin phát biểu
    @Transactional
    public SpeakerQueueResponse requestToSpeak(UUID meetingId, UUID agendaItemId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        checkMeetingInProgress(meeting);

        User caller = currentUserService.getCurrentActiveUser();
        MeetingParticipant participant = meetingParticipantRepository
                .findByMeetingIdAndUserId(meetingId, caller.getId())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHOZIZED));
        if (participant.getAttendanceStatus() != AttendanceStatus.PRESENT) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_PRESENT);
        }

        AgendaItem agendaItem = null;
        if (agendaItemId != null) {
            agendaItem = agendaItemRepository.findById(agendaItemId)
                    .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

            if (!agendaItem.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            AgendaItemStatus agendaStatus = agendaItem.getStatus();
            if (agendaStatus == AgendaItemStatus.DONE
                    || agendaStatus == AgendaItemStatus.SKIPPED) {
                throw new AppException(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN);
            }
        }

        // Check if absent for this agenda item
        boolean isAbsent = false;
        if (participant.getInviteStatus() == InviteStatus.DECLINED) {
            if (participant.getIsFullSession() == null || participant.getIsFullSession()) {
                isAbsent = true;
            } else if (agendaItem != null && participant.getAbsentAgendaItemIds() != null
                    && participant.getAbsentAgendaItemIds().contains(agendaItem.getId())) {
                isAbsent = true;
            }
        }
        if (isAbsent) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        // If substitute, verify original delegate is absent for this agenda item
        if (Boolean.TRUE.equals(participant.getIsSubstitute()) && participant.getSubstituteForParticipantId() != null) {
            MeetingParticipant originalParticipant = meetingParticipantRepository
                    .findById(participant.getSubstituteForParticipantId())
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

            boolean originalAbsent = false;
            if (originalParticipant.getInviteStatus() == InviteStatus.DECLINED) {
                if (originalParticipant.getIsFullSession() == null || originalParticipant.getIsFullSession()) {
                    originalAbsent = true;
                } else if (agendaItem != null && originalParticipant.getAbsentAgendaItemIds() != null
                        && originalParticipant.getAbsentAgendaItemIds().contains(agendaItem.getId())) {
                    originalAbsent = true;
                }
            }
            if (!originalAbsent) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        // SPEAKER-03: Chặn spam — không cho đăng ký nếu đang QUEUED hoặc đang SPEAKING
        boolean alreadyQueued = speakerQueueRepository.existsByMeetingIdAndUserIdAndQueueStatus(
                meetingId, caller.getId(), SpeakerQueueStatus.QUEUED);
        boolean alreadySpeaking = speakerQueueRepository.existsByMeetingIdAndUserIdAndQueueStatus(
                meetingId, caller.getId(), SpeakerQueueStatus.SPEAKING);
        if (alreadyQueued || alreadySpeaking) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        long count = speakerQueueRepository
                .findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.QUEUED)
                .size();

        SpeakerQueue queue = new SpeakerQueue();
        queue.setMeeting(meeting);
        queue.setAgendaItem(agendaItem);
        queue.setUser(caller);
        queue.setRequestedAt(LocalDateTime.now());
        queue.setPriority(SpeakerQueuePriority.NORMAL);
        queue.setSortOrder((int) count + 1);
        queue.setQueueStatus(SpeakerQueueStatus.QUEUED);

        queue = speakerQueueRepository.save(queue);

        auditLogPublisher.publish(
                caller,
                AuditAction.REGISTER_SPEAKER,
                ResourceType.SPEAKER,
                queue.getId(),
                Map.of(
                        "meetingId", String.valueOf(meetingId)));

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId + "/speakers",
                Map.of("action", "REFRESH"));

        return mapToQueueResponse(queue);
    }

    // 2. Đại biểu hoặc Chủ tọa rút/từ chối yêu cầu
    @Transactional
    public void rejectOrCancelRequest(UUID meetingId, UUID queueId) {
        SpeakerQueue queue = speakerQueueRepository.findById(queueId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        User caller = currentUserService.getCurrentActiveUser();

        if (queue.getUser() == null || !queue.getUser().getId().equals(caller.getId())) {
            checkIsChairOrSecretary(meetingId, caller.getId());
            queue.setQueueStatus(SpeakerQueueStatus.REJECTED);
        } else {
            queue.setQueueStatus(SpeakerQueueStatus.CANCELLED);
        }

        speakerQueueRepository.save(queue);

        auditLogPublisher.publish(
                caller,
                AuditAction.CANCEL_SPEAKER_REQUEST,
                ResourceType.SPEAKER,
                queue.getId(),
                Map.of(
                        "meetingId", String.valueOf(meetingId),
                        "status", String.valueOf(queue.getQueueStatus())));

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId + "/speakers",
                Map.of("action", "REFRESH"));
    }

    // 3. Lấy danh sách hàng chờ (tất cả mọi người trong cuộc họp có thể xem)
    public List<SpeakerQueueResponse> getQueue(UUID meetingId, SpeakerQueueStatus status) {
        User caller = currentUserService.getCurrentActiveUser();
        boolean isParticipant = meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, caller.getId());
        if (!isParticipant) {
            Meeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
            meetingService.requireViewPermission(meeting);
        }

        List<SpeakerQueue> list;
        if (status != null) {
            list = speakerQueueRepository.findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId,
                    status);
        } else {
            list = speakerQueueRepository.findByMeetingId(meetingId);
            list.sort((a, b) -> {
                boolean activeA = a.getQueueStatus() == SpeakerQueueStatus.QUEUED
                        || a.getQueueStatus() == SpeakerQueueStatus.SPEAKING;
                boolean activeB = b.getQueueStatus() == SpeakerQueueStatus.QUEUED
                        || b.getQueueStatus() == SpeakerQueueStatus.SPEAKING;
                if (activeA && activeB) {
                    if (a.getSortOrder() != null && b.getSortOrder() != null) {
                        return a.getSortOrder().compareTo(b.getSortOrder());
                    }
                }
                if (activeA)
                    return -1;
                if (activeB)
                    return 1;
                if (a.getRequestedAt() != null && b.getRequestedAt() != null) {
                    return b.getRequestedAt().compareTo(a.getRequestedAt());
                }
                return 0;
            });
        }
        return list.stream().map(this::mapToQueueResponse).collect(Collectors.toList());
    }

    // 4. Đổi vị trí hàng xếp hàng
    @Transactional
    public void reorderQueue(UUID meetingId, ReorderQueueRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsChairOrSecretary(meetingId, caller.getId());

        List<SpeakerQueue> currentQueue = speakerQueueRepository
                .findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.QUEUED);

        int order = 1;
        for (UUID id : request.getQueueIds()) {
            for (SpeakerQueue q : currentQueue) {
                if (q.getId().equals(id)) {
                    q.setSortOrder(order++);
                    speakerQueueRepository.save(q);
                    break;
                }
            }
        }

        auditLogPublisher.publish(
                caller,
                AuditAction.REORDER_SPEAKER_QUEUE,
                ResourceType.SPEAKER,
                meetingId,
                Map.of(
                        "meetingId", String.valueOf(meetingId)));

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId + "/speakers",
                Map.of("action", "REFRESH"));
    }

    // 4.5. Chủ trì yêu cầu chuẩn bị phát biểu
    @Transactional
    public void prepareSpeaker(UUID meetingId, UUID queueId) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsChairOrSecretary(meetingId, caller.getId());

        SpeakerQueue queue = speakerQueueRepository.findById(queueId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (!queue.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        if (queue.getQueueStatus() != SpeakerQueueStatus.QUEUED) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        webSocketNotificationService.sendToTopic(
                "/topic/meeting/" + meetingId + "/speakers",
                Map.of(
                        "action", "PREPARE_SPEECH",
                        "queueId", queue.getId().toString(),
                        "userId", queue.getUser() != null ? queue.getUser().getId().toString() : "",
                        "guestId", queue.getGuest() != null ? queue.getGuest().getId().toString() : "",
                        "userName",
                        queue.getUser() != null ? queue.getUser().getFullName() : queue.getGuest().getFullName()));
    }

    // 5. Đồng ý cho người trong queue phát biểu
    @Transactional
    public SpeakerTurnResponse startTurn(UUID meetingId, UUID queueId, StartTurnRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsChairOrSecretary(meetingId, caller.getId());

        SpeakerQueue queue = speakerQueueRepository.findById(queueId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        // SPEAKER-05: Queue phải thuộc đúng meeting này
        if (!queue.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        if (queue.getQueueStatus() != SpeakerQueueStatus.QUEUED) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        // Check if someone is already speaking
        boolean isSomeoneSpeaking = speakerQueueRepository.existsByMeetingIdAndQueueStatus(meetingId,
                SpeakerQueueStatus.SPEAKING);
        if (isSomeoneSpeaking) {
            throw new AppException(ErrorCode.SPEAKER_ALREADY_SPEAKING);
        }

        queue.setQueueStatus(SpeakerQueueStatus.SPEAKING);
        speakerQueueRepository.save(queue);

        SpeakerTurn turn = new SpeakerTurn();
        turn.setMeeting(queue.getMeeting());
        turn.setAgendaItem(queue.getAgendaItem());
        turn.setUser(queue.getUser());
        turn.setStartAt(LocalDateTime.now());
        turn.setDurationSeconds(Long.valueOf(request.getMinutes() * 60));
        turn.setCreatedBy(caller);
        turn = speakerTurnRepository.save(turn);

        auditLogPublisher.publish(
                caller,
                AuditAction.START_SPEAKER_TURN,
                ResourceType.SPEAKER,
                turn.getId(),
                Map.of(
                        "meetingId", String.valueOf(meetingId),
                        "userId", String.valueOf(queue.getUser().getId()),
                        "durationSeconds", String.valueOf(turn.getDurationSeconds())));

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId + "/speakers",
                Map.of("action", "REFRESH"));

        return mapToTurnResponse(turn);
    }

    // 6. Cho phép phát biểu trực tiếp (Bypass) — chỉ CHAIR/SECRETARY
    @Transactional
    public SpeakerTurnResponse startDirectTurn(UUID meetingId, StartDirectTurnRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsChairOrSecretary(meetingId, caller.getId());

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        UUID targetId = request.getUserId();
        User targetUser = userRepository.findById(targetId).orElse(null);
        MeetingGuest targetGuest = null;

        if (targetUser == null) {
            targetGuest = meetingGuestRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        }

        // Kiểm tra xem targetUser hoặc targetGuest có trong cuộc họp đó không
        if (targetUser != null) {
            checkIsParticipant(meetingId, targetUser.getId());
        } else {
            if (!targetGuest.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
        }

        // Check if there is already an active speaker in the meeting
        boolean isSomeoneSpeaking = speakerQueueRepository.existsByMeetingIdAndQueueStatus(meetingId,
                SpeakerQueueStatus.SPEAKING);

        SpeakerQueue queue = new SpeakerQueue();
        queue.setMeeting(meeting);
        queue.setRequestedAt(LocalDateTime.now());
        queue.setPriority(SpeakerQueuePriority.NORMAL);

        if (isSomeoneSpeaking) {
            List<SpeakerQueue> currentQueue = speakerQueueRepository
                    .findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId,
                            SpeakerQueueStatus.QUEUED);
            int nextSortOrder = currentQueue.isEmpty() ? 1
                    : currentQueue.get(currentQueue.size() - 1).getSortOrder() + 1;
            queue.setSortOrder(nextSortOrder);
            queue.setQueueStatus(SpeakerQueueStatus.QUEUED);
        } else {
            queue.setSortOrder(0);
            queue.setQueueStatus(SpeakerQueueStatus.SPEAKING);
        }

        if (targetUser != null) {
            queue.setUser(targetUser);
        } else {
            queue.setGuest(targetGuest);
        }

        speakerQueueRepository.save(queue);

        SpeakerTurnResponse.SpeakerTurnResponseBuilder responseBuilder = SpeakerTurnResponse.builder()
                .meetingId(meetingId);

        if (targetUser != null) {
            responseBuilder.userId(targetUser.getId())
                    .userName(targetUser.getFullName())
                    .avatarUrl(targetUser.getAvatar())
                    .isGuestSubstitute(false);
        } else {
            responseBuilder.guestId(targetGuest.getId())
                    .userName(targetGuest.getFullName())
                    .isGuestSubstitute(true);
        }

        if (!isSomeoneSpeaking) {
            SpeakerTurn turn = new SpeakerTurn();
            turn.setMeeting(meeting);
            turn.setStartAt(LocalDateTime.now());
            turn.setDurationSeconds(Long.valueOf(request.getMinutes() * 60));
            turn.setCreatedBy(caller);
            if (targetUser != null) {
                turn.setUser(targetUser);
            } else {
                turn.setGuest(targetGuest);
            }
            turn = speakerTurnRepository.save(turn);

            responseBuilder.id(turn.getId())
                    .startAt(turn.getStartAt())
                    .durationSeconds(turn.getDurationSeconds());

            auditLogPublisher.publish(
                    caller,
                    AuditAction.START_SPEAKER_TURN,
                    ResourceType.SPEAKER,
                    turn.getId(),
                    Map.of(
                            "meetingId", String.valueOf(meetingId),
                            "userId", String.valueOf(targetUser != null ? targetUser.getId() : targetGuest.getId()),
                            "durationSeconds", String.valueOf(turn.getDurationSeconds())));
        } else {
            auditLogPublisher.publish(
                    caller,
                    AuditAction.REGISTER_SPEAKER,
                    ResourceType.SPEAKER,
                    queue.getId(),
                    Map.of(
                            "meetingId", String.valueOf(meetingId),
                            "userId", String.valueOf(targetUser != null ? targetUser.getId() : targetGuest.getId())));
        }

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId + "/speakers",
                Map.of("action", "REFRESH"));

        return responseBuilder.build();
    }

    // 7. Ép buộc dừng phát biểu sớm — chỉ CHAIR/SECRETARY
    @Transactional
    public SpeakerTurnResponse stopTurn(UUID meetingId, UUID turnId) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsChairOrSecretary(meetingId, caller.getId());

        SpeakerTurn turn = speakerTurnRepository.findById(turnId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        // SPEAKER-07: Turn phải thuộc đúng meeting này
        if (!turn.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        if (turn.getEndAt() == null) {
            turn.setEndAt(LocalDateTime.now());
            // Cập nhật lại durationSeconds thành thời lượng thực tế
            long actualSeconds = java.time.temporal.ChronoUnit.SECONDS.between(turn.getStartAt(), turn.getEndAt());
            turn.setDurationSeconds(actualSeconds);
            speakerTurnRepository.save(turn);

            // Tìm SpeakerQueue tương ứng để update DONE
            List<SpeakerQueue> speakingQueueList = speakerQueueRepository
                    .findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId,
                            SpeakerQueueStatus.SPEAKING);
            for (SpeakerQueue q : speakingQueueList) {
                boolean match = false;
                if (q.getUser() != null && turn.getUser() != null) {
                    match = q.getUser().getId().equals(turn.getUser().getId());
                } else if (q.getGuest() != null && turn.getGuest() != null) {
                    match = q.getGuest().getId().equals(turn.getGuest().getId());
                }
                if (match) {
                    q.setQueueStatus(SpeakerQueueStatus.DONE);
                    speakerQueueRepository.save(q);
                }
            }
        }

        auditLogPublisher.publish(
                caller,
                AuditAction.STOP_SPEAKER_TURN,
                ResourceType.SPEAKER,
                turn.getId(),
                Map.of(
                        "meetingId", String.valueOf(meetingId),
                        "userId",
                        String.valueOf(turn.getUser() != null ? turn.getUser().getId() : turn.getGuest().getId()),
                        "actualSeconds", String.valueOf(turn.getDurationSeconds())));

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId + "/speakers",
                Map.of("action", "REFRESH"));

        return mapToTurnResponse(turn);
    }

    // SPEAKER-08: Đóng tất cả queue và turn còn active khi meeting chuyển CLOSED
    @Transactional
    public void closeAllQueuesAndTurns(UUID meetingId) {
        LocalDateTime now = LocalDateTime.now();

        // Đóng tất cả queue đang QUEUED hoặc SPEAKING
        List<SpeakerQueue> activeQueues = speakerQueueRepository.findByMeetingId(meetingId);
        for (SpeakerQueue q : activeQueues) {
            if (q.getQueueStatus() == SpeakerQueueStatus.QUEUED
                    || q.getQueueStatus() == SpeakerQueueStatus.SPEAKING) {
                q.setQueueStatus(SpeakerQueueStatus.EXPIRED);
                speakerQueueRepository.save(q);
            }
        }

        // Đóng tất cả turn chưa có endAt
        List<SpeakerTurn> activeTurns = speakerTurnRepository.findByEndAtIsNull();
        for (SpeakerTurn t : activeTurns) {
            if (t.getMeeting().getId().equals(meetingId)) {
                t.setEndAt(now);
                long actualSeconds = ChronoUnit.SECONDS.between(t.getStartAt(), now);
                t.setDurationSeconds(actualSeconds);
                speakerTurnRepository.save(t);
                log.info("Tự động đóng lượt phát biểu (SpeakerTurn ID: {}) do phiên họp đã BỊ ĐÓNG", t.getId());
            }
        }
    }

    // 4. Đổi vị trí hàng xếp hàng — chỉ CHAIR/SECRETARY
    private SpeakerQueueResponse mapToQueueResponse(SpeakerQueue q) {
        SpeakerQueueResponse.SpeakerQueueResponseBuilder builder = SpeakerQueueResponse.builder()
                .id(q.getId())
                .requestedAt(q.getRequestedAt())
                .priority(q.getPriority())
                .sortOrder(q.getSortOrder())
                .queueStatus(q.getQueueStatus())
                .meetingId(q.getMeeting().getId());
        if (q.getUser() != null) {
            builder.userId(q.getUser().getId())
                    .userName(q.getUser().getFullName())
                    .avatarUrl(q.getUser().getAvatar())
                    .isGuestSubstitute(false);
            if (q.getUser().getPosition() != null) {
                builder.position(q.getUser().getPosition().getPositionName());
            }
            if (q.getQueueStatus() == SpeakerQueueStatus.SPEAKING) {
                speakerTurnRepository.findByEndAtIsNull().stream()
                        .filter(t -> t.getMeeting().getId().equals(q.getMeeting().getId())
                                && t.getUser() != null && t.getUser().getId().equals(q.getUser().getId()))
                        .findFirst()
                        .ifPresent(t -> {
                            builder.activeTurnId(t.getId());
                            builder.speakingStartAt(t.getStartAt());
                            builder.speakingDurationSeconds(t.getDurationSeconds());
                        });
            }
        } else if (q.getGuest() != null) {
            builder.guestId(q.getGuest().getId())
                    .userName(q.getGuest().getFullName())
                    .isGuestSubstitute(true);
            if (q.getGuest().getPosition() != null) {
                builder.position(q.getGuest().getPosition());
            }
            if (q.getQueueStatus() == SpeakerQueueStatus.SPEAKING) {
                speakerTurnRepository.findByEndAtIsNull().stream()
                        .filter(t -> t.getMeeting().getId().equals(q.getMeeting().getId())
                                && t.getGuest() != null && t.getGuest().getId().equals(q.getGuest().getId()))
                        .findFirst()
                        .ifPresent(t -> {
                            builder.activeTurnId(t.getId());
                            builder.speakingStartAt(t.getStartAt());
                            builder.speakingDurationSeconds(t.getDurationSeconds());
                        });
            }
        }
        return builder.build();
    }

    private SpeakerTurnResponse mapToTurnResponse(SpeakerTurn t) {
        SpeakerTurnResponse.SpeakerTurnResponseBuilder builder = SpeakerTurnResponse.builder()
                .id(t.getId())
                .startAt(t.getStartAt())
                .endAt(t.getEndAt())
                .durationSeconds(t.getDurationSeconds())
                .meetingId(t.getMeeting().getId());
        if (t.getUser() != null) {
            builder.userId(t.getUser().getId())
                    .userName(t.getUser().getFullName())
                    .avatarUrl(t.getUser().getAvatar())
                    .isGuestSubstitute(false);
        } else if (t.getGuest() != null) {
            builder.guestId(t.getGuest().getId())
                    .userName(t.getGuest().getFullName())
                    .isGuestSubstitute(true);
        }
        return builder.build();
    }

    public List<SpeakerQueueResponse> publicGetQueue(UUID meetingId, SpeakerQueueStatus status) {
        List<SpeakerQueue> list;
        if (status != null) {
            list = speakerQueueRepository.findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId,
                    status);
        } else {
            list = speakerQueueRepository.findByMeetingId(meetingId);
            list.sort((a, b) -> {
                boolean activeA = a.getQueueStatus() == SpeakerQueueStatus.QUEUED
                        || a.getQueueStatus() == SpeakerQueueStatus.SPEAKING;
                boolean activeB = b.getQueueStatus() == SpeakerQueueStatus.QUEUED
                        || b.getQueueStatus() == SpeakerQueueStatus.SPEAKING;
                if (activeA && activeB) {
                    if (a.getSortOrder() != null && b.getSortOrder() != null) {
                        return a.getSortOrder().compareTo(b.getSortOrder());
                    }
                }
                if (activeA)
                    return -1;
                if (activeB)
                    return 1;
                if (a.getRequestedAt() != null && b.getRequestedAt() != null) {
                    return b.getRequestedAt().compareTo(a.getRequestedAt());
                }
                return 0;
            });
        }
        return list.stream().map(this::mapToQueueResponse).collect(Collectors.toList());
    }

    @Transactional
    public SpeakerQueueResponse publicRequestToSpeak(UUID meetingId, UUID agendaItemId, UUID guestToken) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));

        checkMeetingInProgress(meeting);

        MeetingGuest guest = meetingGuestRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        if (!guest.getMeeting().getId().equals(meetingId)) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        if (guest.getAttendanceStatus() != AttendanceStatus.PRESENT) {
            throw new AppException(ErrorCode.PARTICIPANT_NOT_PRESENT);
        }

        if (!Boolean.TRUE.equals(guest.getIsSubstitute()) || guest.getSubstituteForParticipantId() == null) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        AgendaItem agendaItem = null;
        if (agendaItemId != null) {
            agendaItem = agendaItemRepository.findById(agendaItemId)
                    .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

            if (!agendaItem.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            AgendaItemStatus agendaStatus = agendaItem.getStatus();
            if (agendaStatus == AgendaItemStatus.DONE || agendaStatus == AgendaItemStatus.SKIPPED) {
                throw new AppException(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN);
            }
        }

        MeetingParticipant originalParticipant = meetingParticipantRepository
                .findById(guest.getSubstituteForParticipantId())
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_PARTICIPANT_NOT_FOUND));

        boolean originalAbsent = false;
        if (originalParticipant.getInviteStatus() == InviteStatus.DECLINED) {
            if (originalParticipant.getIsFullSession() == null || originalParticipant.getIsFullSession()) {
                originalAbsent = true;
            } else if (agendaItem != null && originalParticipant.getAbsentAgendaItemIds() != null
                    && originalParticipant.getAbsentAgendaItemIds().contains(agendaItem.getId())) {
                originalAbsent = true;
            }
        }

        if (!originalAbsent) {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        boolean alreadyQueued = speakerQueueRepository.existsByMeetingIdAndGuestIdAndQueueStatus(
                meetingId, guest.getId(), SpeakerQueueStatus.QUEUED);
        boolean alreadySpeaking = speakerQueueRepository.existsByMeetingIdAndGuestIdAndQueueStatus(
                meetingId, guest.getId(), SpeakerQueueStatus.SPEAKING);
        if (alreadyQueued || alreadySpeaking) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        long count = speakerQueueRepository
                .findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.QUEUED)
                .size();

        SpeakerQueue queue = new SpeakerQueue();
        queue.setMeeting(meeting);
        queue.setAgendaItem(agendaItem);
        queue.setGuest(guest);
        queue.setRequestedAt(LocalDateTime.now());
        queue.setPriority(SpeakerQueuePriority.NORMAL);
        queue.setSortOrder((int) count + 1);
        queue.setQueueStatus(SpeakerQueueStatus.QUEUED);

        queue = speakerQueueRepository.save(queue);

        auditLogPublisher.publish(
                null,
                AuditAction.REGISTER_SPEAKER,
                ResourceType.SPEAKER,
                queue.getId(),
                Map.of("meetingId", String.valueOf(meetingId)));

        webSocketNotificationService.sendToTopic("/topic/meeting/" + meetingId + "/speakers",
                Map.of("action", "REFRESH"));

        return mapToQueueResponse(queue);
    }
}
