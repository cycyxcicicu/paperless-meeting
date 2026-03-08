package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.UserRoleScope;

import java.util.UUID;

public interface UserRoleScopeRepository extends JpaRepository<UserRoleScope, UUID> {
}
