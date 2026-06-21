package vn.acme.paperless_meeting.service.meeting;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.repository.MeetingRepository;
import vn.acme.paperless_meeting.service.speaker.SpeakerService;
import vn.acme.paperless_meeting.service.motion.MotionService;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingStatusJob {

    MeetingRepository meetingRepository;
    SpeakerService speakerService;
    MotionService motionService;
    WebSocketNotificationService webSocketNotificationService;

    /**
     * Chạy mỗi phút 1 lần.
     * Quét các cuộc họp đang ở trạng thái UPCOMING, nếu startTime <= thời gian hiện tại
     * thì tự động chuyển sang IN_PROGRESS.
     */
    @Scheduled(cron = "0 * * * * *") // Chạy vào mỗi phút
    @Transactional
    public void updateMeetingStatusToInProgress() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Đang chạy MeetingStatusJob lúc {}", now);
        
        List<Meeting> meetingsToStart = meetingRepository.findMeetingsToStart(MeetingStatus.UPCOMING, now);
        
        if (!meetingsToStart.isEmpty()) {
            for (Meeting meeting : meetingsToStart) {
                meeting.setStatus(MeetingStatus.IN_PROGRESS);
            }
            meetingRepository.saveAll(meetingsToStart);
            log.info("Tự động chuyển {} cuộc họp sang trạng thái ĐANG DIỄN RA", meetingsToStart.size());
        }
    }

    /**
     * Chạy mỗi phút 1 lần.
     * Quét các cuộc họp đang ở trạng thái IN_PROGRESS, nếu endTime + 3 tiếng <= thời gian hiện tại
     * thì tự động chuyển sang CLOSED.
     */
    @Scheduled(cron = "0 * * * * *") // Chạy vào mỗi phút
    @Transactional
    public void autoCloseExpiredMeetings() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.minusHours(3);
        
        List<Meeting> meetingsToClose = meetingRepository.findMeetingsToClose(MeetingStatus.IN_PROGRESS, threshold);
        
        if (!meetingsToClose.isEmpty()) {
            for (Meeting meeting : meetingsToClose) {
                meeting.setStatus(MeetingStatus.CLOSED);
                meetingRepository.save(meeting);
                
                // SPEAKER-08: Đóng tất cả hàng chờ và lượt phát biểu còn active
                speakerService.closeAllQueuesAndTurns(meeting.getId());
                
                // VOTE-14: Đóng tất cả phiên biểu quyết còn mở
                motionService.closeAllOpenVoteSessions(meeting.getId());
                
                log.info("Tự động kết thúc cuộc họp ID: {} - Tiêu đề: {}", meeting.getId(), meeting.getTitle());
                
                // Gửi thông báo WebSocket
                webSocketNotificationService.sendToTopic(
                    "/topic/meeting-updates",
                    Map.of("action", "REFRESH_MEETING_LIST", "meetingId", meeting.getId().toString())
                );
                webSocketNotificationService.sendToTopic(
                    "/topic/meeting/" + meeting.getId(),
                    Map.of("action", "REFRESH_MEETING_STATUS", "status", "CLOSED")
                );
            }
        }
    }
}
