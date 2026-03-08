package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.VoteEligibility;

import java.util.UUID;

public interface VoteEligibilityRepository extends JpaRepository<VoteEligibility, UUID> {
}
