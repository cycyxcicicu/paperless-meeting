package vn.acme.paperless_meeting.dto.response.meetingparticipant;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MeetingAttendeesResponse {
    private List<ParticipantResponse> participants;
    private List<GuestResponse> guests;
}
