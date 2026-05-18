package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.VoteOption;

import java.util.List;
import java.util.UUID;

public interface VoteOptionRepository extends JpaRepository<VoteOption, UUID> {

    List<VoteOption> findByVoteSessionIdOrderByOrderNoAsc(UUID voteSessionId);
}
