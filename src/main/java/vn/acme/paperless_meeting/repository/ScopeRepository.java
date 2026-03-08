package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Scope;

import java.util.UUID;

public interface ScopeRepository extends JpaRepository<Scope, UUID> {
}
