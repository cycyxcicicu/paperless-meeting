package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.VoteSession;

import vn.acme.paperless_meeting.entity.enums.VoteSessionStatus;
import java.util.List;
import java.util.UUID;

public interface VoteSessionRepository extends JpaRepository<VoteSession, UUID> {
    List<VoteSession> findByStatus(VoteSessionStatus status);
}
