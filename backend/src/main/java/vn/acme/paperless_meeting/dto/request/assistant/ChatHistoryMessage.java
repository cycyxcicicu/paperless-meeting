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

    @NotBlank(message = "content không được để trống")
    String content;
}
