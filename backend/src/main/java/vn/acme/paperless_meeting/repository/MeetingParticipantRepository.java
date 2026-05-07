package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, UUID> {

	boolean existsByMeetingIdAndUserId(UUID meetingId, UUID userId);

	@EntityGraph(attributePaths = {"user", "meeting"})
	List<MeetingParticipant> findByMeetingId(UUID meetingId);

	@EntityGraph(attributePaths = {"user", "meeting"})
	Optional<MeetingParticipant> findByMeetingIdAndUserId(UUID meetingId, UUID userId);

	long countByMeetingIdAndParticipantRole(UUID meetingId, ParticipantRole participantRole);

	void deleteByMeetingIdAndUserId(UUID meetingId, UUID userId);
}
