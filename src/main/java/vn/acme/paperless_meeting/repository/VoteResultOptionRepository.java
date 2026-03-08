package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.VoteResultOption;

import java.util.UUID;

public interface VoteResultOptionRepository extends JpaRepository<VoteResultOption, UUID> {
}
