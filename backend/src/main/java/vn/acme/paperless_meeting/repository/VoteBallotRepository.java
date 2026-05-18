package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.VoteBallot;

import java.util.UUID;

public interface VoteBallotRepository extends JpaRepository<VoteBallot, UUID> {
    boolean existsByVoteSessionIdAndUserId(UUID voteSessionId, UUID userId);
}
