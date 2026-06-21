package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.acme.paperless_meeting.entity.MeetingGuest;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;

@Repository
public interface MeetingGuestRepository extends JpaRepository<MeetingGuest, UUID> {

    boolean existsByMeetingIdAndEmail(UUID meetingId, String email);

    @EntityGraph(attributePaths = {"meeting"})
    List<MeetingGuest> findByMeetingId(UUID meetingId);

    @EntityGraph(attributePaths = {"meeting"})
    Optional<MeetingGuest> findByMeetingIdAndEmail(UUID meetingId, String email);

    @EntityGraph(attributePaths = {"meeting"})
    Optional<MeetingGuest> findByRsvpToken(UUID rsvpToken);

    @EntityGraph(attributePaths = {"meeting"})
    Optional<MeetingGuest> findByGuestToken(UUID guestToken);

    List<MeetingGuest> findBySubstituteForParticipantId(UUID substituteForParticipantId);

    void deleteByMeetingIdAndId(UUID meetingId, UUID guestId);

    @Query("SELECT COUNT(mg) > 0 FROM MeetingGuest mg " +
           "WHERE mg.email = :email " +
           "AND mg.inviteStatus = :status " +
           "AND mg.meeting.id != :currentMeetingId " +
           "AND mg.meeting.status IN (:activeStatuses) " +
           "AND mg.meeting.startTime < :endTime " +
           "AND mg.meeting.endTime > :startTime")
    boolean hasGuestOverlapConflict(
        @Param("email") String email,
        @Param("status") InviteStatus status,
        @Param("currentMeetingId") UUID currentMeetingId,
        @Param("activeStatuses") List<MeetingStatus> activeStatuses,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
}
