package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Minutes;

import java.util.List;
import java.util.UUID;

public interface MinutesRepository extends JpaRepository<Minutes, UUID> {
    List<Minutes> findByMeetingIdOrderByVersionNoDesc(UUID meetingId);
}
