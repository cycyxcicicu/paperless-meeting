package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.DocTemplate;

import java.util.UUID;

import java.util.Optional;
import java.util.UUID;

public interface DocTemplateRepository extends JpaRepository<DocTemplate, UUID> {
    Optional<DocTemplate> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, UUID id);
    Optional<DocTemplate> findFirstBy();
}
