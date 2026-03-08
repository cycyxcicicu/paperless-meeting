package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.DocumentAccessLog;

import java.util.UUID;

public interface DocumentAccessLogRepository extends JpaRepository<DocumentAccessLog, UUID> {
}
