package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

import vn.acme.paperless_meeting.dto.request.assistant.ChatHistoryMessage;

public interface SpecialistAgent {
    AgentType type();

    String answer(UUID meetingId, UUID callerId, String question, List<ChatHistoryMessage> history);

    /**
     * Giống {@link #answer}, nhưng phát từng đoạn chữ qua onDelta ngay khi model sinh
     * ra (dùng khi Điều phối chỉ chọn đúng 1 agent, cho phép streaming trực tiếp câu
     * trả lời của agent đó tới người dùng).
     */
    String answerStream(UUID meetingId, UUID callerId, String question, List<ChatHistoryMessage> history,
            Consumer<String> onDelta, AtomicBoolean cancelled);
}
