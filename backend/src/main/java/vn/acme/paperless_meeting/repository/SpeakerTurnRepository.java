package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.SpeakerTurn;

import java.util.List;
import java.util.UUID;

public interface SpeakerTurnRepository extends JpaRepository<SpeakerTurn, UUID> {
    List<SpeakerTurn> findByEndAtIsNull();

    @Query("SELECT st FROM SpeakerTurn st " +
           "LEFT JOIN FETCH st.user " +
           "LEFT JOIN FETCH st.guest " +
           "LEFT JOIN FETCH st.agendaItem " +
           "WHERE st.meeting.id = :meetingId")
    List<SpeakerTurn> findByMeetingIdWithDetails(@Param("meetingId") UUID meetingId);
}
