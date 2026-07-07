package vn.acme.paperless_meeting.service.assistant;

import java.util.List;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.dto.request.assistant.ChatHistoryMessage;

/**
 * Agent 1 - Điều phối: phân loại câu hỏi bằng OpenAI Structured Output để quyết định
 * gọi agent chuyên trách nào, hỏi lại (CLARIFY), hay từ chối (OFF_TOPIC/OTHER_MEETING).
 * Xem mục 2 và 5 của kế hoạch (docs/ai-assistant-plan.md).
 */
@Component
@RequiredArgsConstructor
public class OrchestratorAgent {

    private static final String SYSTEM_PROMPT =
            "Bạn là bộ điều phối của trợ lý AI cuộc họp. Nhiệm vụ: phân loại câu hỏi của người tham dự để quyết "
                    + "định cách xử lý. Có 4 agent chuyên trách: "
                    + "MEETING_INFO (thông tin chung cuộc họp, chương trình họp, thành phần tham dự - ai vắng, "
                    + "ai đến muộn, ai là khách mời, ai đã/chưa phát biểu); "
                    + "DOCUMENT (tài liệu cuộc họp, tóm tắt/tìm nội dung trong tài liệu); "
                    + "VOTING (biểu quyết, kết quả, tỷ lệ tán thành); "
                    + "MINUTES_OPINION (biên bản họp, ý kiến đóng góp, lượt phát biểu, góp ý/hướng dẫn chỉnh sửa nội dung). "
                    + "Trả về intent=ANSWER kèm danh sách agent phù hợp (có thể nhiều agent nếu câu hỏi ghép nhiều chủ đề; "
                    + "khi lưỡng lự giữa chọn 1 hay nhiều agent, hãy chọn thừa còn hơn thiếu dữ liệu). "
                    + "Nếu câu hỏi mơ hồ, thiếu ngữ cảnh, không rõ đang hỏi về nội dung/người/tài liệu nào - trả về "
                    + "intent=CLARIFY kèm một câu hỏi làm rõ ngắn gọn, TUYỆT ĐỐI không đoán. "
                    + "Nếu câu hỏi đề cập một cuộc họp khác (không phải cuộc họp đang mở) - trả về intent=OTHER_MEETING. "
                    + "Nếu câu hỏi ngoài phạm vi cuộc họp (thời tiết, chính trị, tán gẫu...) - trả về intent=OFF_TOPIC.";

    private final OpenAiChatClient openAiChatClient;
    private final OpenAiProperties openAiProperties;

    public OrchestratorDecision classify(String question, List<ChatHistoryMessage> history) {
        String userMessage = buildUserMessage(question, history);
        return openAiChatClient.structuredChat(
                openAiProperties.routerModel(), SYSTEM_PROMPT, userMessage, OrchestratorDecision.class);
    }

    private String buildUserMessage(String question, List<ChatHistoryMessage> history) {
        StringBuilder sb = new StringBuilder();
        if (history != null && !history.isEmpty()) {
            sb.append("Lịch sử hội thoại gần đây (để hiểu câu hỏi nối tiếp, ví dụ sau khi đã hỏi lại làm rõ):\n");
            for (ChatHistoryMessage msg : history) {
                sb.append("- ").append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
            }
        }
        sb.append("<cau_hoi>").append(question).append("</cau_hoi>");
        return sb.toString();
    }
}
