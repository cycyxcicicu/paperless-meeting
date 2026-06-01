package vn.acme.paperless_meeting.dto.request.agenda;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AgendaItemPrepRequest {
    private LocalDateTime prepDeadline;
    private String content; // Ghi chú/hướng dẫn chuẩn bị tài liệu
}
