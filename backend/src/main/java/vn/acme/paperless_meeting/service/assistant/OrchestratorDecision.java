package vn.acme.paperless_meeting.service.assistant;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import vn.acme.paperless_meeting.service.assistant.agent.AgentType;

/**
 * Kết quả phân loại của Agent Điều phối, trả về qua OpenAI Structured Output
 * (JSON Schema tự sinh từ các trường public bên dưới - xem StructuredOutputsExample
 * của OpenAI Java SDK).
 */
public class OrchestratorDecision {

    public enum Intent {
        ANSWER,
        CLARIFY,
        OFF_TOPIC,
        OTHER_MEETING
    }

    // Đặt TRƯỚC "intent" một cách có chủ ý: kỹ thuật Chain-of-Thought áp dụng cho
    // Structured Output - vì OpenAI sinh các trường JSON theo đúng thứ tự khai báo,
    // buộc model phải "suy nghĩ ra tiếng" (diễn giải ý định thật của câu hỏi, kể cả
    // khi hỏi bằng khẩu ngữ/thiếu dấu) TRƯỚC KHI chốt intent/agents, thay vì đoán ẩu.
    @JsonPropertyDescription("Suy nghĩ ngắn gọn (1-2 câu) trước khi quyết định: câu hỏi này thực sự đang hỏi về "
            + "điều gì, kể cả khi người dùng dùng từ ngữ đời thường/khẩu ngữ/viết tắt/thiếu dấu? Trường dữ liệu "
            + "nào (nếu có) trong 4 nhóm dữ liệu bên dưới khớp với ý định đó?")
    public String reasoning;

    @JsonPropertyDescription("Loại ý định của câu hỏi: ANSWER nếu có thể trả lời trong phạm vi cuộc họp này, "
            + "CLARIFY nếu câu hỏi mơ hồ hoặc thiếu ngữ cảnh cần hỏi lại người dùng, OFF_TOPIC nếu câu hỏi ngoài "
            + "phạm vi cuộc họp (thời tiết, chính trị, tán gẫu...), OTHER_MEETING nếu câu hỏi đề cập một cuộc họp "
            + "khác không phải cuộc họp đang mở.")
    public Intent intent;

    @JsonPropertyDescription("Danh sách agent chuyên trách cần gọi khi intent=ANSWER. Có thể chọn nhiều agent nếu "
            + "câu hỏi ghép nhiều chủ đề. Để mảng rỗng nếu intent khác ANSWER.")
    public List<AgentType> agents;

    @JsonPropertyDescription("Câu hỏi làm rõ để hỏi lại người dùng khi intent=CLARIFY. Để chuỗi rỗng nếu intent khác CLARIFY.")
    public String clarifyingQuestion;
}
