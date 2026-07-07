package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.AttendanceLog;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, UUID> {
    Optional<AttendanceLog> findByMeetingIdAndUserId(UUID meetingId, UUID userId);
    Optional<AttendanceLog> findByMeetingIdAndGuestId(UUID meetingId, UUID guestId);
    List<AttendanceLog> findByMeetingId(UUID meetingId);
}
