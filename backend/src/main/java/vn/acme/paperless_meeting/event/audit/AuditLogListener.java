package vn.acme.paperless_meeting.event.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import vn.acme.paperless_meeting.entity.AuditLog;
import vn.acme.paperless_meeting.repository.AuditLogRepository;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditLogListener {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Async
    @EventListener
    public void handleAuditLogEvent(AuditLogEvent event) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setActorUser(event.getActor());
            auditLog.setAction(event.getAction());
            auditLog.setResourceType(event.getResourceType());
            auditLog.setResourceId(event.getResourceId());
            
            if (event.getMetadata() != null && !event.getMetadata().isEmpty()) {
                String metaJson = objectMapper.writeValueAsString(event.getMetadata());
                auditLog.setMetaJson(metaJson);
            }
            
            auditLogRepository.save(auditLog);
            log.info("Đã lưu Nhật ký hệ thống (AuditLog): Hành động={}, Loại tài nguyên={}, ID tài nguyên={}", 
                     event.getAction(), event.getResourceType(), event.getResourceId());
        } catch (JsonProcessingException e) {
            log.error("Lỗi tuần tự hóa metadata của AuditLog: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("Lưu AuditLog thất bại: {}", e.getMessage(), e);
        }
    }
}
