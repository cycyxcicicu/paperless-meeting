package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendInvitationsRequest {
    private List<UUID> userIds;
    private List<UUID> guestIds;
    private Boolean forceResend;
}
