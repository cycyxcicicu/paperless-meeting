package vn.acme.paperless_meeting.dto.request.personalnote;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PersonalNoteRequest {
    @NotNull(message = "ID cuộc họp không được để trống")
    UUID meetingId;

    UUID agendaItemId;


    String noteContent;
}
