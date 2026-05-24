package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.MeetingInvitation;

import java.util.UUID;

public interface MeetingInvitationRepository extends JpaRepository<MeetingInvitation, UUID> {
    boolean existsByMeetingIdAndInviteeUserIdAndSendStatus(UUID meetingId, UUID userId, vn.acme.paperless_meeting.entity.enums.SendStatus sendStatus);
    boolean existsByMeetingIdAndInviteeGuestIdAndSendStatus(UUID meetingId, UUID guestId, vn.acme.paperless_meeting.entity.enums.SendStatus sendStatus);
}
