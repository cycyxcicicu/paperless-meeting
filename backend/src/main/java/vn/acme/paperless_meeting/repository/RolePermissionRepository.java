package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.RolePermission;

import java.util.Set;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
    @Query("SELECT rp.permission.permCode FROM RolePermission rp WHERE rp.role.id = :roleId")
    Set<String> findPermissionCodesByRoleId(@Param("roleId") UUID roleId);
}
