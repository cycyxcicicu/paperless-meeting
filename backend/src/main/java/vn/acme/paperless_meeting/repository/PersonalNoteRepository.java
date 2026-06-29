package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.PersonalNote;

public interface PersonalNoteRepository extends JpaRepository<PersonalNote, UUID> {
    List<PersonalNote> findByUserIdAndMeetingIdOrderByCreatedAtDesc(UUID userId, UUID meetingId);

    @Query("SELECT n FROM PersonalNote n JOIN FETCH n.meeting m WHERE n.user.id = :userId")
    Page<PersonalNote> findByUserIdWithMeetings(@Param("userId") UUID userId, Pageable pageable);

    Optional<PersonalNote> findByIdAndUserId(UUID id, UUID userId);
}
