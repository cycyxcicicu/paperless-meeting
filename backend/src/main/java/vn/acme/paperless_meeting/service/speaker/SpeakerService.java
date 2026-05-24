package vn.acme.paperless_meeting.service.speaker;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
import vn.acme.paperless_meeting.entity.SpeakerQueue;
import vn.acme.paperless_meeting.entity.SpeakerTurn;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueuePriority;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueueStatus;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import java.util.Map;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AgendaItemRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.repository.SpeakerQueueRepository;
import vn.acme.paperless_meeting.repository.SpeakerTurnRepository;
import vn.acme.paperless_meeting.repository.UserRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SpeakerService {

    SpeakerQueueRepository speakerQueueRepository;
    SpeakerTurnRepository speakerTurnRepository;
    MeetingRepository meetingRepository;
    MeetingParticipantRepository meetingParticipantRepository;
    UserRepository userRepository;
    AgendaItemRepository agendaItemRepository;
    CurrentUserService currentUserService;
    AuditLogPublisher auditLogPublisher;

    // SPEAKER-06: Chỉ CHAIR hoặc SECRETARY mới được gọi/dừng lượt phát biểu
    private void checkIsChairOrSecretary(UUID meetingId, UUID userId) {
        boolean isChair = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                meetingId, userId, ParticipantRole.CHAIR);
        if (isChair) return;
        boolean isSecretary = meetingParticipantRepository.existsByMeetingIdAndUserIdAndParticipantRole(
                meetingId, userId, ParticipantRole.SECRETARY);
        if (isSecretary) return;
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
        checkIsParticipant(meetingId, caller.getId());

        // SPEAKER-03: Chặn spam — không cho đăng ký nếu đang QUEUED hoặc đang SPEAKING
        boolean alreadyQueued = speakerQueueRepository.existsByMeetingIdAndUserIdAndQueueStatus(
                meetingId, caller.getId(), SpeakerQueueStatus.QUEUED);
        boolean alreadySpeaking = speakerQueueRepository.existsByMeetingIdAndUserIdAndQueueStatus(
                meetingId, caller.getId(), SpeakerQueueStatus.SPEAKING);
        if (alreadyQueued || alreadySpeaking) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        AgendaItem agendaItem = null;
        if (agendaItemId != null) {
            agendaItem = agendaItemRepository.findById(agendaItemId)
                    .orElseThrow(() -> new AppException(ErrorCode.AGENDA_ITEM_NOT_FOUND));

            // SPEAKER-04: Agenda phải thuộc đúng meeting này
            if (!agendaItem.getMeeting().getId().equals(meetingId)) {
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            // SPEAKER-09: Không cho đăng ký vào agenda đã DONE hoặc SKIPPED
            vn.acme.paperless_meeting.entity.enums.AgendaItemStatus agendaStatus = agendaItem.getStatus();
            if (agendaStatus == vn.acme.paperless_meeting.entity.enums.AgendaItemStatus.DONE
                    || agendaStatus == vn.acme.paperless_meeting.entity.enums.AgendaItemStatus.SKIPPED) {
                throw new AppException(ErrorCode.AGENDA_MODIFICATION_FORBIDDEN);
            }
        }

        long count = speakerQueueRepository.findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.QUEUED).size();

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
                        "meetingId", String.valueOf(meetingId)
                )
        );

        return mapToQueueResponse(queue);
    }

    // 2. Đại biểu hoặc Chủ tọa rút/từ chối yêu cầu
    @Transactional
    public void rejectOrCancelRequest(UUID meetingId, UUID queueId) {
        SpeakerQueue queue = speakerQueueRepository.findById(queueId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));
        
        User caller = currentUserService.getCurrentActiveUser();
        
        if (!queue.getUser().getId().equals(caller.getId())) {
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
                        "status", String.valueOf(queue.getQueueStatus())
                )
        );
    }

    // 3. Lấy danh sách hàng chờ (tất cả mọi người trong cuộc họp có thể xem)
    public List<SpeakerQueueResponse> getQueue(UUID meetingId) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsParticipant(meetingId, caller.getId());
        
        List<SpeakerQueue> list = speakerQueueRepository.findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.QUEUED);
        return list.stream().map(this::mapToQueueResponse).collect(Collectors.toList());
    }

    // 4. Đổi vị trí hàng xếp hàng
    @Transactional
    public void reorderQueue(UUID meetingId, ReorderQueueRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsChairOrSecretary(meetingId, caller.getId());

        List<SpeakerQueue> currentQueue = speakerQueueRepository.findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.QUEUED);
        
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
                        "meetingId", String.valueOf(meetingId)
                )
        );
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
                        "durationSeconds", String.valueOf(turn.getDurationSeconds())
                )
        );

        return mapToTurnResponse(turn);
    }

    // 6. Cho phép phát biểu trực tiếp (Bypass) — chỉ CHAIR/SECRETARY
    @Transactional
    public SpeakerTurnResponse startDirectTurn(UUID meetingId, StartDirectTurnRequest request) {
        User caller = currentUserService.getCurrentActiveUser();
        checkIsChairOrSecretary(meetingId, caller.getId());

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new AppException(ErrorCode.MEETING_NOT_EXIST));
        
        User targetUser = userRepository.findById(request.getUserId())
                 .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Kiểm tra xem targetUser có là participant/guest trong cuộc họp đó không
        checkIsParticipant(meetingId, targetUser.getId());

        SpeakerTurn turn = new SpeakerTurn();
        turn.setMeeting(meeting);
        turn.setUser(targetUser);
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
                        "userId", String.valueOf(targetUser.getId()),
                        "durationSeconds", String.valueOf(turn.getDurationSeconds())
                )
        );

        return mapToTurnResponse(turn);
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
            List<SpeakerQueue> speakingQueueList = speakerQueueRepository.findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(meetingId, SpeakerQueueStatus.SPEAKING);
            for (SpeakerQueue q : speakingQueueList) {
                if (q.getUser().getId().equals(turn.getUser().getId())) {
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
                        "userId", String.valueOf(turn.getUser().getId()),
                        "actualSeconds", String.valueOf(turn.getDurationSeconds())
                )
        );

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
                log.info("Auto closed SpeakerTurn ID: {} on meeting CLOSED", t.getId());
            }
        }
    }

    // 4. Đổi vị trí hàng xếp hàng — chỉ CHAIR/SECRETARY
    private SpeakerQueueResponse mapToQueueResponse(SpeakerQueue q) {
        return SpeakerQueueResponse.builder()
                .id(q.getId())
                .requestedAt(q.getRequestedAt())
                .priority(q.getPriority())
                .sortOrder(q.getSortOrder())
                .queueStatus(q.getQueueStatus())
                .userId(q.getUser().getId())
                .userName(q.getUser().getFullName())
                .avatarUrl(q.getUser().getAvatar())
                .meetingId(q.getMeeting().getId())
                .build();
    }

    private SpeakerTurnResponse mapToTurnResponse(SpeakerTurn t) {
        return SpeakerTurnResponse.builder()
                .id(t.getId())
                .startAt(t.getStartAt())
                .endAt(t.getEndAt())
                .durationSeconds(t.getDurationSeconds())
                .userId(t.getUser().getId())
                .userName(t.getUser().getFullName())
                .avatarUrl(t.getUser().getAvatar())
                .meetingId(t.getMeeting().getId())
                .build();
    }
}
