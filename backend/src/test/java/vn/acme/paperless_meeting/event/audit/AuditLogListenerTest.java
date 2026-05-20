package vn.acme.paperless_meeting.event.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.acme.paperless_meeting.entity.AuditLog;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.repository.AuditLogRepository;

import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class AuditLogListenerTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogListener auditLogListener;

    private User mockUser;
    private UUID mockResourceId;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(UUID.randomUUID());
        mockResourceId = UUID.randomUUID();
    }

    @Test
    void handleAuditLogEvent_Success_WithMetadata() throws JsonProcessingException {
        // Arrange
        Map<String, Object> metadata = Map.of("key", "value");
        AuditLogEvent event = new AuditLogEvent(this, mockUser, AuditAction.CREATE_MEETING, ResourceType.MEETING, mockResourceId, metadata);
        
        // Act
        auditLogListener.handleAuditLogEvent(event);
        
        // Assert
        verify(auditLogRepository, times(1)).save(argThat(auditLog -> {
            assertThat(auditLog.getActorUser()).isEqualTo(mockUser);
            assertThat(auditLog.getAction()).isEqualTo(AuditAction.CREATE_MEETING);
            assertThat(auditLog.getResourceType()).isEqualTo(ResourceType.MEETING);
            assertThat(auditLog.getResourceId()).isEqualTo(mockResourceId);
            assertThat(auditLog.getMetaJson()).isEqualTo("{\"key\":\"value\"}");
            return true;
        }));
    }

    @Test
    void handleAuditLogEvent_Success_WithoutMetadata() {
        // Arrange
        AuditLogEvent event = new AuditLogEvent(this, mockUser, AuditAction.CREATE_MEETING, ResourceType.MEETING, mockResourceId, null);
        
        // Act
        auditLogListener.handleAuditLogEvent(event);
        
        // Assert
        verify(auditLogRepository, times(1)).save(argThat(auditLog -> {
            assertThat(auditLog.getMetaJson()).isNull();
            return true;
        }));
    }
}
