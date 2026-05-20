package vn.acme.paperless_meeting.service.speaker;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.entity.SpeakerQueue;
import vn.acme.paperless_meeting.entity.SpeakerTurn;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueueStatus;
import vn.acme.paperless_meeting.repository.SpeakerQueueRepository;
import vn.acme.paperless_meeting.repository.SpeakerTurnRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class SpeakerStatusJob {

    private final SpeakerQueueRepository speakerQueueRepository;
    private final SpeakerTurnRepository speakerTurnRepository;

    @Scheduled(fixedDelay = 5000) // Chạy mỗi 5 giây
    @Transactional
    public void autoUpdateSpeakerStatus() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Auto close expired Speaker Turns (các lượt phát biểu đã hết giờ)
        List<SpeakerTurn> openTurns = speakerTurnRepository.findByEndAtIsNull();
        for (SpeakerTurn turn : openTurns) {
            if (turn.getStartAt() != null && turn.getDurationSeconds() != null) {
                LocalDateTime expireTime = turn.getStartAt().plusSeconds(turn.getDurationSeconds());
                if (now.isAfter(expireTime)) {
                    turn.setEndAt(expireTime);
                    speakerTurnRepository.save(turn);

                    // Đổi trạng thái Queue tương ứng sang DONE
                    List<SpeakerQueue> speakingQueues = speakerQueueRepository.findByQueueStatus(SpeakerQueueStatus.SPEAKING);
                    for (SpeakerQueue q : speakingQueues) {
                        if (q.getUser().getId().equals(turn.getUser().getId()) 
                            && q.getMeeting().getId().equals(turn.getMeeting().getId())) {
                            q.setQueueStatus(SpeakerQueueStatus.DONE);
                            speakerQueueRepository.save(q);
                        }
                    }

                    log.info("Auto closed expired SpeakerTurn ID: {}", turn.getId());
                }
            }
        }

        // 2. Auto expire pending Speaker Queue requests older than 5 minutes
        List<SpeakerQueue> pendingQueues = speakerQueueRepository.findByQueueStatus(SpeakerQueueStatus.QUEUED);
        LocalDateTime expireThreshold = now.minusMinutes(5);
        for (SpeakerQueue q : pendingQueues) {
            if (q.getRequestedAt() != null && q.getRequestedAt().isBefore(expireThreshold)) {
                q.setQueueStatus(SpeakerQueueStatus.EXPIRED);
                speakerQueueRepository.save(q);
                log.info("Auto expired SpeakerQueue ID: {}", q.getId());
            }
        }
    }
}
