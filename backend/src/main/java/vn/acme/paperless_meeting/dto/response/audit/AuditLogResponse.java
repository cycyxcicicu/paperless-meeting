package vn.acme.paperless_meeting.dto.response.audit;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AuditLogResponse {
    private UUID id;
    private String username;
    private String userRole;
    private String ipAddress;
    private String action; // 'create' | 'update' | 'delete' | 'read'
    private String actionCode; // e.g. "CREATE_MEETING"
    private String actionDescription; // e.g. "Tạo cuộc họp"
    private String objectType;
    private String objectName;
    private String description;
    private LocalDateTime timestamp;
    private String severity; // 'low' | 'medium' | 'high' | 'critical'
}
