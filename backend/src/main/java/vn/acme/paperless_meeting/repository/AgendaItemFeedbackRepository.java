package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.AgendaItemFeedback;

public interface AgendaItemFeedbackRepository extends JpaRepository<AgendaItemFeedback, UUID> {
    List<AgendaItemFeedback> findByAgendaItemIdOrderByCreatedAtAsc(UUID agendaItemId);
    List<AgendaItemFeedback> findByAgendaItemIdInOrderByCreatedAtAsc(List<UUID> agendaItemIds);

    @Query("SELECT f FROM AgendaItemFeedback f LEFT JOIN FETCH f.author " +
           "WHERE f.agendaItem.id IN :agendaItemIds ORDER BY f.createdAt ASC")
    List<AgendaItemFeedback> findByAgendaItemIdInWithAuthor(@Param("agendaItemIds") List<UUID> agendaItemIds);
}
