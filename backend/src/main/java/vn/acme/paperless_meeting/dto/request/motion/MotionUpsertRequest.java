package vn.acme.paperless_meeting.dto.request.motion;

import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MotionUpsertRequest {
    UUID id;
    String title;
    String description;
    UUID agendaItemId;
}
