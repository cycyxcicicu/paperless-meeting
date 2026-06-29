package vn.acme.paperless_meeting.dto.response.personalnote;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class PersonalNoteResponse {
    private UUID id;
    private UUID meetingId;
    private String meetingTitle;
    private UUID agendaItemId;
    private String agendaItemTitle;
    private String noteContent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
