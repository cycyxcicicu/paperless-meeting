package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;

public interface AgendaItemRepository extends JpaRepository<AgendaItem, UUID> {
    boolean existsByMeetingIdAndStatus(UUID meetingId, AgendaItemStatus status);
    int countByMeetingIdAndStatus(UUID meetingId, AgendaItemStatus status);

    List<AgendaItem> findByMeetingIdOrderByOrderNoAsc(UUID meetingId);

    @Query("SELECT a FROM AgendaItem a LEFT JOIN FETCH a.preparedByUser WHERE a.meeting.id = :meetingId ORDER BY a.orderNo ASC")
    List<AgendaItem> findByMeetingIdOrderByOrderNoAscWithPreparer(@Param("meetingId") UUID meetingId);

    List<AgendaItem> findByPreparedByUserId(UUID preparedByUserId);

    /**
     * Load AgendaItem kèm Meeting (và createdBy, department) để tránh N+1 trong
     * getAssignedPreparationMeetings.
     */
    @Query("SELECT a FROM AgendaItem a " +
            "JOIN FETCH a.meeting m " +
            "LEFT JOIN FETCH m.createdBy " +
            "LEFT JOIN FETCH m.department " +
            "LEFT JOIN FETCH m.location " +
            "WHERE a.preparedByUser.id = :preparedByUserId")
    List<AgendaItem> findByPreparedByUserIdWithMeeting(@Param("preparedByUserId") UUID preparedByUserId);

    boolean existsByMeetingIdAndPreparedByUserId(UUID meetingId, UUID preparedByUserId);

    @Query("SELECT DISTINCT a.meeting.id FROM AgendaItem a WHERE a.meeting.id IN :meetingIds AND a.preparedByUser.id = :preparedByUserId")
    List<UUID> findMeetingIdsByPreparedByUserIdAndMeetingIdIn(@Param("meetingIds") List<UUID> meetingIds,
            @Param("preparedByUserId") UUID preparedByUserId);
}
