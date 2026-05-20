package vn.acme.paperless_meeting.event.audit;

import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Getter
public class AuditLogEvent extends ApplicationEvent {
    
    private final User actor;
    private final AuditAction action;
    private final ResourceType resourceType;
    private final UUID resourceId;
    private final Map<String, Object> metadata;

    public AuditLogEvent(Object source, User actor, AuditAction action, ResourceType resourceType, UUID resourceId, Map<String, Object> metadata) {
        super(source);
        this.actor = actor;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.metadata = metadata;
    }
}
