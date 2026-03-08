package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Location;

import java.util.UUID;

public interface LocationRepository extends JpaRepository<Location, UUID> {
}
