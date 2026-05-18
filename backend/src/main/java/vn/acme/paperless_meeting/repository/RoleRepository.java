package vn.acme.paperless_meeting.repository;

import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.Role;

public interface RoleRepository extends JpaRepository<Role, UUID> {
	boolean existsByRoleCode(String roleCode);

	boolean existsByRoleCodeAndIdNot(String roleCode, UUID id);

	Integer countByRoleCodeIn(Set<String> codes);

	Set<Role> findByRoleCodeIn(Set<String> codes);

	@Query("select r from Role r join r.rolePermissionSet rp where rp.permission.id = :permId")
	Set<Role> findByRolePermissionPermissionId(@Param("permId") UUID permId);
}
