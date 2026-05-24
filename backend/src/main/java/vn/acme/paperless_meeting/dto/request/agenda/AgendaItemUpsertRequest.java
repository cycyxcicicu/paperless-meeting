package vn.acme.paperless_meeting.dto.request.agenda;

import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "Thời lượng dự kiến không được để trống")
    @Min(value = 1, message = "Thời lượng dự kiến phải lớn hơn 0")
    Integer durationEst;
    UUID preparedByUserId;
    LocalDateTime startTime;
    LocalDateTime endTime;
}
