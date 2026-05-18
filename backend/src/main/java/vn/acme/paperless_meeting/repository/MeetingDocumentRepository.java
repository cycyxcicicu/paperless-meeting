package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.acme.paperless_meeting.entity.MeetingDocument;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface MeetingDocumentRepository extends JpaRepository<MeetingDocument, UUID> {
    List<MeetingDocument> findByAgendaItemId(UUID agendaItemId);
    void deleteByAgendaItemId(UUID agendaItemId);

    @Query("SELECT md FROM MeetingDocument md " +
           "LEFT JOIN FETCH md.document d " +
           "LEFT JOIN FETCH d.currentVersion cv " +
           "LEFT JOIN FETCH md.agendaItem a " +
           "WHERE md.meeting.id = :meetingId")
    List<MeetingDocument> findByMeetingIdWithDocsAndVersions(@Param("meetingId") UUID meetingId);
}
