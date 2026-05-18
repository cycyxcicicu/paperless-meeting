package vn.acme.paperless_meeting.dto.request.meetingparticipant;

import java.util.List;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddAttendeesRequest {
    
    @Valid
    private List<AddParticipantRequest> participants;

    @Valid
    private List<AddGuestRequest> guests;
}
