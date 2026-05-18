package vn.acme.paperless_meeting.service.meeting;

import java.time.LocalDateTime;
import java.util.List;

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

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingStatusJob {

    MeetingRepository meetingRepository;

    /**
     * Chạy mỗi phút 1 lần.
     * Quét các cuộc họp đang ở trạng thái UPCOMING, nếu startTime <= thời gian hiện tại
     * thì tự động chuyển sang IN_PROGRESS.
     */
    @Scheduled(cron = "0 * * * * *") // Chạy vào mỗi phút
    @Transactional
    public void updateMeetingStatusToInProgress() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Running MeetingStatusJob at {}", now);
        
        List<Meeting> meetingsToStart = meetingRepository.findMeetingsToStart(MeetingStatus.UPCOMING, now);
        
        if (!meetingsToStart.isEmpty()) {
            for (Meeting meeting : meetingsToStart) {
                meeting.setStatus(MeetingStatus.IN_PROGRESS);
            }
            meetingRepository.saveAll(meetingsToStart);
            log.info("Automatically transitioned {} meetings to IN_PROGRESS", meetingsToStart.size());
        }
    }
}
