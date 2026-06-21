package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.MeetingParticipant;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import java.time.LocalDateTime;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, UUID> {

	boolean existsByMeetingIdAndUserId(UUID meetingId, UUID userId);

	boolean existsByMeetingIdAndUserIdAndParticipantRole(UUID meetingId, UUID userId, ParticipantRole participantRole);

	@EntityGraph(attributePaths = {"user", "user.department", "user.position", "substituteUser", "meeting"})
	List<MeetingParticipant> findByMeetingId(UUID meetingId);

	@EntityGraph(attributePaths = {"user", "user.department", "user.position", "substituteUser", "meeting"})
	Optional<MeetingParticipant> findByMeetingIdAndUserId(UUID meetingId, UUID userId);

	long countByMeetingIdAndParticipantRole(UUID meetingId, ParticipantRole participantRole);

	long countByMeetingIdAndParticipantRoleNot(UUID meetingId, ParticipantRole participantRole);

	List<MeetingParticipant> findBySubstituteForParticipantId(UUID substituteForParticipantId);

	void deleteByMeetingIdAndUserId(UUID meetingId, UUID userId);

	@Query("SELECT COUNT(mp) > 0 FROM MeetingParticipant mp " +
		   "WHERE mp.user.id = :userId " +
		   "AND mp.inviteStatus = :status " +
		   "AND mp.meeting.id != :currentMeetingId " +
		   "AND mp.meeting.status IN (:activeStatuses) " +
		   "AND mp.meeting.startTime < :endTime " +
		   "AND mp.meeting.endTime > :startTime")
	boolean hasOverlapConflict(
		@Param("userId") UUID userId,
		@Param("status") InviteStatus status,
		@Param("currentMeetingId") UUID currentMeetingId,
		@Param("activeStatuses") List<MeetingStatus> activeStatuses,
		@Param("startTime") LocalDateTime startTime,
		@Param("endTime") LocalDateTime endTime
	);

	@EntityGraph(attributePaths = {"user", "user.department", "user.position", "substituteUser", "meeting"})
	List<MeetingParticipant> findByMeetingIdIn(List<UUID> meetingIds);

	@Query("SELECT COUNT(mp) > 0 FROM MeetingParticipant mp " +
		   "WHERE mp.meeting.id IN :meetingIds AND mp.user.id = :userId")
	boolean isUserParticipantOfAnyMeeting(@Param("meetingIds") List<UUID> meetingIds, @Param("userId") UUID userId);
}
