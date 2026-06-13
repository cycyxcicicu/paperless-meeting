package vn.acme.paperless_meeting.service.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi thông báo đến một người dùng cụ thể.
     * Người dùng này phải subscribe kênh: /user/queue/notifications
     */
    public void sendNotificationToUser(String username, String type, String message, Map<String, Object> data) {
        log.info("Sending WebSocket notification to user: {}, type: {}", username, type);
        try {
            Map<String, Object> payload = Map.of(
                "type", type,
                "message", message,
                "data", data,
                "timestamp", System.currentTimeMillis()
            );
            messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to user {}", username, e);
        }
    }

    /**
     * Gửi tin nhắn đến một topic công khai/nhóm.
     * Client subscribe kênh: /topic/...
     */
    public void sendToTopic(String topic, Object payload) {
        log.info("Broadcasting to topic: {}", topic);
        try {
            messagingTemplate.convertAndSend(topic, payload);
        } catch (Exception e) {
            log.error("Failed to broadcast to topic {}", topic, e);
        }
    }
}
