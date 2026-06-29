package vn.acme.paperless_meeting.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.SavedMeeting;

public interface SavedMeetingRepository extends JpaRepository<SavedMeeting, UUID> {
    Optional<SavedMeeting> findByUserIdAndMeetingId(UUID userId, UUID meetingId);
    boolean existsByUserIdAndMeetingId(UUID userId, UUID meetingId);

    @Query("SELECT s FROM SavedMeeting s JOIN FETCH s.meeting m LEFT JOIN FETCH m.location LEFT JOIN FETCH m.createdBy LEFT JOIN FETCH m.department WHERE s.user.id = :userId")
    Page<SavedMeeting> findByUserIdWithMeetings(@Param("userId") UUID userId, Pageable pageable);
}
