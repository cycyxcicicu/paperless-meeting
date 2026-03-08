package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.AclEntry;

import java.util.UUID;

public interface AclEntryRepository extends JpaRepository<AclEntry, UUID> {
}
