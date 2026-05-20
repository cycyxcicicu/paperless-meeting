package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.SpeakerQueue;
import vn.acme.paperless_meeting.entity.enums.SpeakerQueueStatus;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface SpeakerQueueRepository extends JpaRepository<SpeakerQueue, UUID> {
    List<SpeakerQueue> findByMeetingIdAndQueueStatusOrderBySortOrderAscRequestedAtAsc(UUID meetingId, SpeakerQueueStatus queueStatus);
    List<SpeakerQueue> findByQueueStatus(SpeakerQueueStatus queueStatus);
    boolean existsByMeetingIdAndUserIdAndQueueStatus(UUID meetingId, UUID userId, SpeakerQueueStatus queueStatus);
}
