package vn.acme.paperless_meeting.dto.request.agenda;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AgendaItemUpsertRequest {
    String title;
    String content;
    Integer orderNo;
    Integer durationEst;
    UUID preparedByUserId;
    LocalDateTime startTime;
    LocalDateTime endTime;
}
