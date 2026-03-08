package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.AgendaItem;

import java.util.UUID;

public interface AgendaItemRepository extends JpaRepository<AgendaItem, UUID> {
}
