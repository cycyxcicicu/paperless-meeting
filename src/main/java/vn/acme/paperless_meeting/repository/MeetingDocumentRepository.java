package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.acme.paperless_meeting.entity.MeetingDocument;
import java.util.UUID;

public interface MeetingDocumentRepository extends JpaRepository<MeetingDocument, UUID> {
}
