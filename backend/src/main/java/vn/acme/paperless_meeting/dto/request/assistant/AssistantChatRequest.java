package vn.acme.paperless_meeting.dto.request.assistant;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssistantChatRequest {
    @NotBlank(message = "Vui lòng nhập câu hỏi")
    String question;

    @Valid
    @Size(max = 6, message = "Chỉ giữ tối đa 6 tin nhắn lịch sử gần nhất")
    List<ChatHistoryMessage> history;
}
