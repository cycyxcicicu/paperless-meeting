package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.Opinion;

import java.util.List;
import java.util.UUID;

public interface OpinionRepository extends JpaRepository<Opinion, UUID> {
    @Query("SELECT o FROM Opinion o LEFT JOIN FETCH o.user u LEFT JOIN FETCH u.position LEFT JOIN FETCH o.attachments WHERE o.meeting.id = :meetingId ORDER BY o.createdAt ASC")
    List<Opinion> findByMeetingIdWithUserAndAttachments(@Param("meetingId") UUID meetingId);
}
