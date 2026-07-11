package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.VoteBallot;

import java.util.UUID;

public interface VoteBallotRepository extends JpaRepository<VoteBallot, UUID> {
    boolean existsByVoteSessionIdAndUserId(UUID voteSessionId, UUID userId);
    boolean existsByVoteSessionIdAndGuestId(UUID voteSessionId, UUID guestId);
    java.util.List<VoteBallot> findByVoteSessionId(UUID voteSessionId);

    @Query("SELECT b FROM VoteBallot b " +
            "LEFT JOIN FETCH b.user u " +
            "LEFT JOIN FETCH b.guest g " +
            "LEFT JOIN FETCH b.voteBallotChoiceList vbc " +
            "LEFT JOIN FETCH vbc.option " +
            "WHERE b.voteSession.id = :voteSessionId")
    java.util.List<VoteBallot> findByVoteSessionIdWithDetails(@Param("voteSessionId") UUID voteSessionId);
}
