package vn.acme.paperless_meeting.service.motion;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.entity.VoteSession;
import vn.acme.paperless_meeting.entity.enums.MotionStatus;
import vn.acme.paperless_meeting.entity.enums.VoteSessionStatus;
import vn.acme.paperless_meeting.repository.VoteSessionRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class VoteStatusJob {

    private final VoteSessionRepository voteSessionRepository;

    @Scheduled(fixedDelay = 5000) // Chạy mỗi 5 giây
    @Transactional
    public void autoCloseExpiredVotes() {
        LocalDateTime now = LocalDateTime.now();
        List<VoteSession> openSessions = voteSessionRepository.findByStatus(VoteSessionStatus.OPEN);

        for (VoteSession session : openSessions) {
            if (session.getOpenedAt() != null && session.getDurationMinutes() != null) {
                LocalDateTime expireTime = session.getOpenedAt().plusMinutes(session.getDurationMinutes());
                if (now.isAfter(expireTime)) {
                    session.setStatus(VoteSessionStatus.CLOSED);
                    session.setClosedAt(expireTime);
                    voteSessionRepository.save(session);

                    if (session.getMotion() != null) {
                        session.getMotion().setStatus(MotionStatus.CLOSED);
                    }
                    log.info("Auto closed expired VoteSession ID: {} for Motion: {}", session.getId(), 
                             session.getMotion() != null ? session.getMotion().getTitle() : "N/A");
                }
            }
        }
    }
}
