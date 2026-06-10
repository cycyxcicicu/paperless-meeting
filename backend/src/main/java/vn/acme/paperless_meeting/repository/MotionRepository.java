package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Motion;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface MotionRepository extends JpaRepository<Motion, UUID> {
    List<Motion> findByAgendaItemId(UUID agendaItemId);

    List<Motion> findByMeetingId(UUID meetingId);

    @Query("SELECT m FROM Motion m LEFT JOIN FETCH m.createdBy WHERE m.agendaItem.id = :agendaItemId")
    List<Motion> findByAgendaItemIdWithCreator(@Param("agendaItemId") UUID agendaItemId);
}
