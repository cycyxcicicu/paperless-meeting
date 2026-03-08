package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Motion;

import java.util.UUID;

public interface MotionRepository extends JpaRepository<Motion, UUID> {
}
