package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.AgendaItemFeedback;

public interface AgendaItemFeedbackRepository extends JpaRepository<AgendaItemFeedback, UUID> {
    List<AgendaItemFeedback> findByAgendaItemIdOrderByCreatedAtAsc(UUID agendaItemId);
    List<AgendaItemFeedback> findByAgendaItemIdInOrderByCreatedAtAsc(List<UUID> agendaItemIds);
}
