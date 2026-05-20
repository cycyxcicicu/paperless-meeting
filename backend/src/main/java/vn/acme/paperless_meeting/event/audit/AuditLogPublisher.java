package vn.acme.paperless_meeting.event.audit;

import java.util.Map;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Component
@RequiredArgsConstructor
public class AuditLogPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public void publish(User actor, AuditAction action, ResourceType resourceType, UUID resourceId, Map<String, Object> metadata) {
        if (actor == null) return;
        AuditLogEvent event = new AuditLogEvent(this, actor, action, resourceType, resourceId, metadata);
        eventPublisher.publishEvent(event);
    }
}
