package vn.acme.paperless_meeting.service.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi thông báo đến một người dùng cụ thể.
     * Người dùng này phải subscribe kênh: /user/queue/notifications
     * Trì hoãn gửi cho đến khi transaction hiện tại được commit thành công để tránh race condition ở client.
     */
    public void sendNotificationToUser(UUID notificationId, String username, String type, String message, Map<String, Object> data) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendNotificationToUserImmediately(notificationId, username, type, message, data);
                }
            });
        } else {
            sendNotificationToUserImmediately(notificationId, username, type, message, data);
        }
    }

    private void sendNotificationToUserImmediately(UUID notificationId, String username, String type, String message, Map<String, Object> data) {
        log.info("Đang gửi thông báo WebSocket tới người dùng: {}, loại: {}", username, type);
        try {
            Map<String, Object> payload = Map.of(
                "id", notificationId != null ? notificationId.toString() : "",
                "type", type,
                "message", message,
                "data", data,
                "timestamp", System.currentTimeMillis()
            );
            messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
        } catch (Exception e) {
            log.error("Gửi thông báo WebSocket tới người dùng {} thất bại", username, e);
        }
    }

    public void sendNotificationToUser(String username, String type, String message, Map<String, Object> data) {
        sendNotificationToUser(null, username, type, message, data);
    }

    /**
     * Gửi tin nhắn đến một topic công khai/nhóm.
     * Client subscribe kênh: /topic/...
     * Trì hoãn gửi cho đến khi transaction hiện tại được commit thành công để tránh race condition ở client.
     */
    public void sendToTopic(String topic, Object payload) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendToTopicImmediately(topic, payload);
                }
            });
        } else {
            sendToTopicImmediately(topic, payload);
        }
    }

    private void sendToTopicImmediately(String topic, Object payload) {
        log.info("Đang phát sóng tới topic: {}", topic);
        try {
            messagingTemplate.convertAndSend(topic, payload);
        } catch (Exception e) {
            log.error("Phát sóng tới topic {} thất bại", topic, e);
        }
    }
}
