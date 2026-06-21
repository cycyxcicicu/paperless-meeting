package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.AuditLog;
import vn.acme.paperless_meeting.entity.enums.AuditAction;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.createdAt >= :startOfDay")
    long countTodayLogs(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(a) FROM AuditLog a JOIN a.actorUser u WHERE a.createdAt >= :startOfDay AND u.department.id IN :deptIds")
    long countTodayLogsByDepartments(@Param("startOfDay") LocalDateTime startOfDay, @Param("deptIds") Collection<UUID> deptIds);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action IN :actions")
    long countCriticalActions(@Param("actions") Collection<AuditAction> actions);

    @Query("SELECT COUNT(a) FROM AuditLog a JOIN a.actorUser u WHERE a.action IN :actions AND u.department.id IN :deptIds")
    long countCriticalActionsByDepartments(@Param("actions") Collection<AuditAction> actions, @Param("deptIds") Collection<UUID> deptIds);

    @Query("SELECT COUNT(DISTINCT a.actorUser.id) FROM AuditLog a")
    long countActiveUsers();

    @Query("SELECT COUNT(DISTINCT a.actorUser.id) FROM AuditLog a JOIN a.actorUser u WHERE u.department.id IN :deptIds")
    long countActiveUsersByDepartments(@Param("deptIds") Collection<UUID> deptIds);

    @Query("SELECT COUNT(a) FROM AuditLog a JOIN a.actorUser u WHERE u.department.id IN :deptIds")
    long countTotalLogsByDepartments(@Param("deptIds") Collection<UUID> deptIds);
}

