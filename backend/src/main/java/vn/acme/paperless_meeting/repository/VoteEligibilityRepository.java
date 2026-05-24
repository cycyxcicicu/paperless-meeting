package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import vn.acme.paperless_meeting.entity.VoteEligibility;

import java.util.UUID;

public interface VoteEligibilityRepository extends JpaRepository<VoteEligibility, UUID> {
    long countByVoteSessionId(UUID voteSessionId);
    boolean existsByVoteSessionIdAndUserIdAndEligibleTrue(UUID voteSessionId, UUID userId);

    @Modifying
    @Query("UPDATE VoteEligibility ve SET ve.eligible = false, ve.reason = :reason WHERE ve.user.id = :userId AND ve.voteSession.id IN (SELECT vs.id FROM VoteSession vs WHERE vs.meeting.id = :meetingId AND vs.status IN ('SCHEDULED', 'OPEN'))")
    void revokeVoteEligibility(UUID meetingId, UUID userId, String reason);
}
