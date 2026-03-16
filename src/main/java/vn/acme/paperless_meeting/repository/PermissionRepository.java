package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Permission;

import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
	boolean existsByPermCode(String permCode);

	boolean existsByPermCodeAndIdNot(String permCode, UUID id);
}
