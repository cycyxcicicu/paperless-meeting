package vn.acme.paperless_meeting.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Notification;

import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByUserIdOrderByScheduledAtDesc(UUID userId, Pageable pageable);
}
