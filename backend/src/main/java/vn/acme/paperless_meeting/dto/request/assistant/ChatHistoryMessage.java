package vn.acme.paperless_meeting.dto.request.assistant;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatHistoryMessage {
    @NotBlank(message = "role không được để trống")
    String role; // "user" hoặc "assistant"

    // Không @NotBlank: 1 tin lịch sử rỗng (vd: lượt trước bị dừng trước khi có chữ nào)
    // sẽ chỉ bị bỏ qua khi dựng request cho OpenAI (xem OpenAiChatClient), không được
    // để làm hỏng toàn bộ câu hỏi mới - hàng rào phòng thủ thêm cho lỗi @NotBlank cũ.
    String content;
}
