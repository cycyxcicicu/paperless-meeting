package vn.acme.paperless_meeting.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import org.springframework.data.jpa.repository.Modifying;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MeetingRepository extends JpaRepository<Meeting, UUID>, JpaSpecificationExecutor<Meeting> {
    @EntityGraph(attributePaths = { "createdBy", "location", "department" })
    List<Meeting> findAllByOrderByCreatedAtDesc();

    @Override
    @EntityGraph(attributePaths = { "createdBy", "createdBy.department", "createdBy.position", "location", "department" })
    Optional<Meeting> findById(UUID id);

    @Query("SELECT m FROM Meeting m WHERE m.status = :status AND m.startTime <= :now")
    List<Meeting> findMeetingsToStart(@Param("status") MeetingStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT m FROM Meeting m WHERE m.status = :status AND m.endTime <= :threshold")
    List<Meeting> findMeetingsToClose(@Param("status") MeetingStatus status, @Param("threshold") LocalDateTime threshold);

    List<Meeting> findByStatusAndStartTimeBetween(MeetingStatus status, LocalDateTime start, LocalDateTime end);

    @Query("""
                select case when count(m) > 0 then true else false end
                from Meeting m
                where m.location.id = :locationId
                  and (:meetingId is null or m.id <> :meetingId)
                  and m.status in :statuses
                  and m.startTime < :endTime
                  and m.endTime > :startTime
            """)
    boolean existsRoomConflict(@Param("meetingId") UUID meetingId,
            @Param("locationId") UUID locationId,
            @Param("statuses") List<MeetingStatus> statuses,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query(value = "SELECT * FROM meetings WHERE id = :id", nativeQuery = true)
    Optional<Meeting> findByIdIncludingDeleted(@Param("id") UUID id);

    @Modifying
    @Query(value = "UPDATE meetings SET is_deleted = false, deleted_at = null WHERE id = :id", nativeQuery = true)
    void restoreMeetingNative(@Param("id") UUID id);

    @Query(value = "SELECT CAST(id AS CHAR) FROM meetings WHERE JSON_UNQUOTE(JSON_EXTRACT(agenda_file, '$.id')) = :documentId", nativeQuery = true)
    List<String> findMeetingIdsByAgendaFileId(@Param("documentId") String documentId);

    @EntityGraph(attributePaths = { "createdBy", "location", "department" })
    List<Meeting> findByStatus(MeetingStatus status);

    @EntityGraph(attributePaths = { "createdBy", "location", "department" })
    List<Meeting> findByCreatedById(UUID createdById);
}
