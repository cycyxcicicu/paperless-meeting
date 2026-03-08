package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.AclPrincipal;

import java.util.UUID;

public interface AclPrincipalRepository extends JpaRepository<AclPrincipal, UUID> {
}
