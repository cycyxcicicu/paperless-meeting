package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.VoteResult;

import java.util.UUID;

public interface VoteResultRepository extends JpaRepository<VoteResult, UUID> {
}
