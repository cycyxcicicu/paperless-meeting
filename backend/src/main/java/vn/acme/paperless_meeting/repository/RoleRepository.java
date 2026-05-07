package vn.acme.paperless_meeting.repository;

import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.Role;

public interface RoleRepository extends JpaRepository<Role, UUID> {
	boolean existsByRoleName(String roleName);

	boolean existsByRoleNameAndIdNot(String roleName, UUID id);

	Integer countByRoleNameIn(Set<String> names);

	Set<Role> findByRoleNameIn(Set<String> names);

	@Query("select r from Role r join r.rolePermissionSet rp where rp.permission.id = :permId")
	Set<Role> findByRolePermissionPermissionId(@Param("permId") UUID permId);
}
