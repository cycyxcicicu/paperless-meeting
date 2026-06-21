package vn.acme.paperless_meeting.service.audit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.response.audit.AuditLogResponse;
import vn.acme.paperless_meeting.dto.response.audit.AuditLogStatsResponse;
import vn.acme.paperless_meeting.entity.AuditLog;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AuditLogRepository;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;
import vn.acme.paperless_meeting.service.department.DepartmentService;
import vn.acme.paperless_meeting.specification.audit.AuditLogSpecification;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuditLogService {
    AuditLogRepository auditLogRepository;
    CurrentUserService currentUserService;
    DepartmentService departmentService;
    ObjectMapper objectMapper = new ObjectMapper();

    private static final List<AuditAction> CRITICAL_ACTIONS = List.of(
            AuditAction.DELETE_MEETING,
            AuditAction.DELETE_DOCUMENT,
            AuditAction.DELETE_MOTION,
            AuditAction.CANCEL_MEETING,
            AuditAction.REJECT_RESOURCE
    );

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> findAll(String keyword, Pageable pageable) {
        User caller = currentUserService.getCurrentActiveUser();
        List<UUID> allowedDeptIds = null;

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            // SUPER_ADMIN can see all
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            // DEPARTMENT_ADMIN only sees their department + sub-departments
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                throw new AppException(ErrorCode.UNAUTHOZIZED);
            }
            allowedDeptIds = departmentService.getAllSubDepartmentIds(callerDeptId);
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        Specification<AuditLog> spec = AuditLogSpecification.build(keyword, allowedDeptIds);
        Page<AuditLog> page = auditLogRepository.findAll(spec, pageable);

        List<AuditLogResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.<AuditLogResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public AuditLogStatsResponse getStats() {
        User caller = currentUserService.getCurrentActiveUser();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        long totalLogs;
        long todayLogs;
        long criticalActions;
        long activeUsers;

        if (currentUserService.hasRole(RoleName.SUPER_ADMIN)) {
            totalLogs = auditLogRepository.count();
            todayLogs = auditLogRepository.countTodayLogs(startOfDay);
            criticalActions = auditLogRepository.countCriticalActions(CRITICAL_ACTIONS);
            activeUsers = auditLogRepository.countActiveUsers();
        } else if (currentUserService.hasRole(RoleName.DEPARTMENT_ADMIN)) {
            UUID callerDeptId = caller.getDepartment() != null ? caller.getDepartment().getId() : null;
            if (callerDeptId == null) {
                return AuditLogStatsResponse.builder().build();
            }
            List<UUID> deptIds = departmentService.getAllSubDepartmentIds(callerDeptId);
            if (deptIds.isEmpty()) {
                return AuditLogStatsResponse.builder().build();
            }
            totalLogs = auditLogRepository.countTotalLogsByDepartments(deptIds);
            todayLogs = auditLogRepository.countTodayLogsByDepartments(startOfDay, deptIds);
            criticalActions = auditLogRepository.countCriticalActionsByDepartments(CRITICAL_ACTIONS, deptIds);
            activeUsers = auditLogRepository.countActiveUsersByDepartments(deptIds);
        } else {
            throw new AppException(ErrorCode.UNAUTHOZIZED);
        }

        return AuditLogStatsResponse.builder()
                .totalLogs(totalLogs)
                .todayLogs(todayLogs)
                .criticalActions(criticalActions)
                .activeUsers(activeUsers)
                .build();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        User actor = log.getActorUser();
        String actorFullName = actor != null ? actor.getFullName() : "Hệ thống";
        String actorRole = "";
        if (actor != null) {
            if (actor.getRole() != null) {
                actorRole = actor.getRole().getRoleName();
            } else if (actor.getPosition() != null) {
                actorRole = actor.getPosition().getPositionName();
            }
        }

        // Parse metaJson
        String ipAddress = "127.0.0.1";
        String objectName = "";
        Map<String, Object> metaMap = new HashMap<>();
        if (log.getMetaJson() != null && !log.getMetaJson().isBlank()) {
            try {
                metaMap = objectMapper.readValue(log.getMetaJson(), new TypeReference<Map<String, Object>>() {});
                if (metaMap.containsKey("ip")) {
                    ipAddress = String.valueOf(metaMap.get("ip"));
                } else if (metaMap.containsKey("ipAddress")) {
                    ipAddress = String.valueOf(metaMap.get("ipAddress"));
                } else if (metaMap.containsKey("clientIp")) {
                    ipAddress = String.valueOf(metaMap.get("clientIp"));
                }

                if (metaMap.containsKey("title")) {
                    objectName = String.valueOf(metaMap.get("title"));
                } else if (metaMap.containsKey("name")) {
                    objectName = String.valueOf(metaMap.get("name"));
                } else if (metaMap.containsKey("fileName")) {
                    objectName = String.valueOf(metaMap.get("fileName"));
                } else if (metaMap.containsKey("documentName")) {
                    objectName = String.valueOf(metaMap.get("documentName"));
                } else if (metaMap.containsKey("username")) {
                    objectName = String.valueOf(metaMap.get("username"));
                }
            } catch (Exception e) {
                // Ignore parse errors
            }
        }

        // Action Code & Translation
        String actionCode = log.getAction() != null ? log.getAction().name() : "OTHER";
        String actionDescription = log.getAction() != null ? log.getAction().getDescription() : "Khác";

        // Object Type Translation
        String objectType = log.getResourceType() != null ? log.getResourceType().getDescription() : "Khác";

        // Compute Description
        String description = actionDescription;
        if (!objectName.isEmpty()) {
            description = actionDescription + " \"" + objectName + "\"";
        } else if (log.getResourceType() != null) {
            description = actionDescription + " " + log.getResourceType().getDescription().toLowerCase();
        }

        return AuditLogResponse.builder()
                .id(log.getId())
                .username(actorFullName)
                .userRole(actorRole)
                .ipAddress(ipAddress)
                .action(mapActionToSimpleAction(log.getAction()))
                .actionCode(actionCode)
                .actionDescription(actionDescription)
                .objectType(objectType)
                .objectName(objectName)
                .description(description)
                .timestamp(log.getCreatedAt())
                .severity(mapActionToSeverity(log.getAction()))
                .build();
    }

    private String mapActionToSimpleAction(AuditAction action) {
        if (action == null) return "read";
        switch (action) {
            case CREATE_MEETING:
            case UPLOAD_DOCUMENT:
            case ADD_PARTICIPANT:
            case CREATE_MOTION:
                return "create";
            case DELETE_MEETING:
            case DELETE_DOCUMENT:
            case DELETE_MOTION:
            case REMOVE_PARTICIPANT:
                return "delete";
            case UPDATE_MEETING:
            case UPDATE_DOCUMENT:
            case UPDATE_AGENDA:
            case REORDER_SPEAKER_QUEUE:
            case CHANGE_PARTICIPANT_ROLE:
            case ATTACH_DOCUMENT:
            case DETACH_DOCUMENT:
            case REGISTER_SPEAKER:
            case CANCEL_SPEAKER_REQUEST:
            case START_SPEAKER_TURN:
            case STOP_SPEAKER_TURN:
            case CAST_VOTE:
            case PARTICIPANT_CHECK_IN:
            case SUBMIT_APPROVAL:
            case APPROVE_RESOURCE:
            case REJECT_RESOURCE:
            case OPEN_VOTE:
            case CLOSE_VOTE:
            case PUBLISH_MINUTES:
                return "update";
            case LOGIN:
            case CANCEL_MEETING:
            case CLOSE_MEETING:
            case OTHER:
            default:
                return "read";
        }
    }

    private String mapActionToSeverity(AuditAction action) {
        if (action == null) return "low";
        switch (action) {
            case DELETE_MEETING:
            case DELETE_DOCUMENT:
            case DELETE_MOTION:
                return "high";
            case CANCEL_MEETING:
            case REJECT_RESOURCE:
                return "medium";
            case OTHER:
            default:
                return "low";
        }
    }
}
