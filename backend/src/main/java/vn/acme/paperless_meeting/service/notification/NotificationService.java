package vn.acme.paperless_meeting.service.notification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.entity.Notification;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.enums.ChannelType;
import vn.acme.paperless_meeting.entity.enums.NotificationStatus;
import vn.acme.paperless_meeting.entity.enums.NotificationType;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.repository.NotificationRepository;
import vn.acme.paperless_meeting.service.websocket.WebSocketNotificationService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationService {

    NotificationRepository notificationRepository;
    WebSocketNotificationService webSocketNotificationService;

    @Transactional
    public void sendToUser(User user, String content, NotificationType type, ResourceType refType, UUID refId, String wsType, Map<String, Object> wsData) {
        try {
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setType(type);
            notification.setStatus(NotificationStatus.PENDING);
            notification.setChannel(ChannelType.APP);
            notification.setRefType(refType);
            notification.setRefId(refId);
            notification.setContent(content);
            notification.setScheduledAt(LocalDateTime.now());
            notificationRepository.save(notification);

            webSocketNotificationService.sendNotificationToUser(
                notification.getId(),
                user.getUsername(),
                wsType,
                content,
                wsData
            );
        } catch (Exception e) {
            log.error("Gửi và lưu thông báo tới người dùng {} thất bại", user.getUsername(), e);
        }
    }

    @Transactional
    public void notifyParticipants(List<MeetingParticipant> participants, User excludeUser, String content, NotificationType type, ResourceType refType, UUID refId, String wsType, Map<String, Object> wsData) {
        log.info("=== notifyParticipants START === Total participants: {}, refId: {}", participants.size(), refId);
        
        int savedCount = 0;
        for (MeetingParticipant participant : participants) {
            if (participant.getUser() == null) {
                log.warn("Đại biểu {} không có thông tin người dùng, bỏ qua", participant.getId());
                continue;
            }
            User user = participant.getUser();
            log.info("Đang xử lý đại biểu: userId={}, username={}, fullName={}", 
                user.getId(), user.getUsername(), user.getFullName());

            try {
                // Lưu thông báo vào CSDL cho tất cả đại biểu (kể cả người tạo để đảm bảo tính nhất quán)
                Notification notification = new Notification();
                notification.setUser(user);
                notification.setType(type);
                notification.setStatus(NotificationStatus.PENDING);
                notification.setChannel(ChannelType.APP);
                notification.setRefType(refType);
                notification.setRefId(refId);
                notification.setContent(content);
                notification.setScheduledAt(LocalDateTime.now());
                notificationRepository.saveAndFlush(notification);
                savedCount++;
                log.info("Đã lưu thông báo id={} cho người dùng={}", notification.getId(), user.getUsername());

                // Gửi thông báo qua WebSocket tới tất cả đại biểu
                webSocketNotificationService.sendNotificationToUser(
                    notification.getId(),
                    user.getUsername(),
                    wsType,
                    content,
                    wsData
                );
            } catch (Exception e) {
                log.error("Gửi thông báo tới đại biểu {} (userId={}) thất bại", user.getUsername(), user.getId(), e);
            }
        }
        
        log.info("=== notifyParticipants END === Saved {} notifications out of {} participants", savedCount, participants.size());
    }

    public void broadcastTopic(String topic, Object payload) {
        webSocketNotificationService.sendToTopic(topic, payload);
    }
}
