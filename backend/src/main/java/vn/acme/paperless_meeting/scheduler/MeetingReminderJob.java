package vn.acme.paperless_meeting.scheduler;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.repository.MeetingRepository;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MeetingReminderJob {
    private static final Logger log = LoggerFactory.getLogger(MeetingReminderJob.class);

    MeetingRepository meetingRepository;
    vn.acme.paperless_meeting.repository.NotificationRepository notificationRepository;
    vn.acme.paperless_meeting.repository.MeetingParticipantRepository meetingParticipantRepository;

    // Chạy mỗi giờ một lần (VD: 8h, 9h, 10h...)
    @Scheduled(cron = "0 0 * * * *")
    public void scheduleMeetingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twoHoursLater = now.plusHours(2);
        
        log.info("Bắt đầu Job quét các cuộc họp sắp diễn ra để gửi nhắc nhở (Reminder)");

        // RÀNG BUỘC INVITE-07: Chỉ lấy các cuộc họp UPCOMING (bỏ qua CANCELLED, KẾT THÚC)
        List<Meeting> upcomingMeetings = meetingRepository.findByStatusAndStartTimeBetween(
                MeetingStatus.UPCOMING, now, twoHoursLater);

        for (Meeting meeting : upcomingMeetings) {
            log.info("Tạo Reminder cho cuộc họp: {}", meeting.getTitle());
            List<vn.acme.paperless_meeting.entity.MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meeting.getId());
            
            for (vn.acme.paperless_meeting.entity.MeetingParticipant p : participants) {
                // Ta chỉ gửi nhắc nhở cho người dùng đã Đồng ý tham gia
                if (p.getInviteStatus() != vn.acme.paperless_meeting.entity.enums.InviteStatus.ACCEPTED) {
                    continue;
                }

                vn.acme.paperless_meeting.entity.Notification notification = new vn.acme.paperless_meeting.entity.Notification();
                notification.setUser(p.getUser());
                notification.setType(vn.acme.paperless_meeting.entity.enums.NotificationType.PREPARATION_REMINDER);
                notification.setStatus(vn.acme.paperless_meeting.entity.enums.NotificationStatus.PENDING);
                notification.setChannel(vn.acme.paperless_meeting.entity.enums.ChannelType.EMAIL);
                notification.setRefType(vn.acme.paperless_meeting.entity.enums.ResourceType.MEETING);
                notification.setRefId(meeting.getId());
                notification.setContent("Nhắc nhở: Cuộc họp sắp diễn ra vào lúc " + meeting.getStartTime());
                notification.setScheduledAt(LocalDateTime.now());
                if (notificationRepository != null) {
                    notificationRepository.save(notification);
                }
            }
        }
    }
}
