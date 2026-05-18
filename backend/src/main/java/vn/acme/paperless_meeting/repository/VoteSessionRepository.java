package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.VoteSession;

import vn.acme.paperless_meeting.entity.enums.VoteSessionStatus;
import java.util.List;
import java.util.UUID;

public interface VoteSessionRepository extends JpaRepository<VoteSession, UUID> {
    List<VoteSession> findByStatus(VoteSessionStatus status);

    /**
     * Load VoteSession kèm Motion để tránh N+1 query trong VoteStatusJob.
     */
    @Query("SELECT s FROM VoteSession s JOIN FETCH s.motion WHERE s.status = :status")
    List<VoteSession> findByStatusWithMotion(@Param("status") VoteSessionStatus status);
}
