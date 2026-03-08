package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.VoteBallotChoice;

import java.util.UUID;

public interface VoteBallotChoiceRepository extends JpaRepository<VoteBallotChoice, UUID> {
}
