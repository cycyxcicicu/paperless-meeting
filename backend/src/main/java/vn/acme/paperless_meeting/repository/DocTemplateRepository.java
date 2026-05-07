package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.DocTemplate;

import java.util.UUID;

public interface DocTemplateRepository extends JpaRepository<DocTemplate, UUID> {
}
