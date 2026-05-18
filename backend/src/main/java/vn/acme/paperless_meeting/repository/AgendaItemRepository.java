package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.AgendaItem;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface AgendaItemRepository extends JpaRepository<AgendaItem, UUID> {
    List<AgendaItem> findByMeetingIdOrderByOrderNoAsc(UUID meetingId);

    @Query("SELECT a FROM AgendaItem a LEFT JOIN FETCH a.preparedByUser WHERE a.meeting.id = :meetingId ORDER BY a.orderNo ASC")
    List<AgendaItem> findByMeetingIdOrderByOrderNoAscWithPreparer(@Param("meetingId") UUID meetingId);

    List<AgendaItem> findByPreparedByUserId(UUID preparedByUserId);

    boolean existsByMeetingIdAndPreparedByUserId(UUID meetingId, UUID preparedByUserId);
}
