package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.VoteBallotChoice;

import java.util.UUID;

public interface VoteBallotChoiceRepository extends JpaRepository<VoteBallotChoice, UUID> {

    /**
     * Đếm số phiếu hợp lệ theo optionId tại DB, tránh kéo toàn bộ data lên RAM.
     */
    @Query("SELECT COUNT(c) FROM VoteBallotChoice c WHERE c.option.id = :optionId AND c.ballot.isValid = true")
    long countValidChoicesByOption(@Param("optionId") UUID optionId);

    /**
     * Đếm số ballot hợp lệ theo voteSessionId tại DB.
     */
    @Query("SELECT COUNT(DISTINCT c.ballot.id) FROM VoteBallotChoice c WHERE c.ballot.voteSession.id = :sessionId AND c.ballot.isValid = true")
    long countValidBallotsBySession(@Param("sessionId") UUID sessionId);
}
