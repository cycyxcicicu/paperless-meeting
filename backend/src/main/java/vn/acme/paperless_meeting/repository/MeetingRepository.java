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

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    @EntityGraph(attributePaths = { "createdBy", "location", "department" })
    List<Meeting> findAllByOrderByCreatedAtDesc();

    @Override
    @EntityGraph(attributePaths = { "createdBy", "location", "department" })
    Optional<Meeting> findById(UUID id);

    @Query("""
                select case when count(m) > 0 then true else false end
                from Meeting m
                where m.location.id = :locationId
                  and m.id <> :meetingId
                  and m.status in :statuses
                  and m.startTime < :endTime
                  and m.endTime > :startTime
            """)
    boolean existsRoomConflict(@Param("meetingId") UUID meetingId,
            @Param("locationId") UUID locationId,
            @Param("statuses") List<vn.acme.paperless_meeting.entity.enums.MeetingStatus> statuses,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
