package vn.acme.paperless_meeting.dto.request.agenda;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.motion.MotionUpsertRequest;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AgendaItemUpsertRequest {
    UUID id; // null đối với các mục tạo mới
    String title;
    String content;
    Integer orderNo;

    @NotNull(message = "Thời lượng dự kiến không được để trống")
    @Min(value = 1, message = "Thời lượng dự kiến phải lớn hơn 0")
    Integer durationEst;
    UUID preparedByUserId;
    LocalDateTime startTime;
    LocalDateTime endTime;
    List<UUID> documentIds; // các tài liệu liên kết
    List<MotionUpsertRequest> motions; // các vấn đề biểu quyết đi kèm
    String prepInstructions;
}
