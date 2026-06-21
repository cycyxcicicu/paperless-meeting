package vn.acme.paperless_meeting.event.meeting;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.config.RabbitMqConfig;

@Component
@RequiredArgsConstructor
@Slf4j
public class MeetingPublishedEventListener {
    private final RabbitTemplate rabbitTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMeetingPublishedEvent(MeetingPublishedEvent event) {
        log.info("Giao dịch cuộc họp đã được commit thành công. Đang gửi meetingId={} tới hàng đợi RabbitMQ", event.getMeetingId());
        try {
            rabbitTemplate.convertAndSend(
                RabbitMqConfig.MEETING_EXCHANGE,
                RabbitMqConfig.INVITATION_ROUTING_KEY,
                event.getMeetingId().toString()
            );
        } catch (Exception e) {
            log.error("Lỗi khi đẩy tin nhắn công bố cuộc họp tới RabbitMQ cho meetingId: {}", event.getMeetingId(), e);
        }
    }
}
