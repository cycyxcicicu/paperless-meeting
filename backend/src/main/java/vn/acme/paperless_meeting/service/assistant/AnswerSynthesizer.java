package vn.acme.paperless_meeting.service.assistant;

import java.util.Map;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.service.assistant.agent.AgentType;

/**
 * Tổng hợp câu trả lời khi Điều phối gọi từ 2 agent chuyên trách trở lên (câu hỏi
 * ghép nhiều chủ đề, ví dụ "nội dung 2 biểu quyết ra sao và có tài liệu gì?").
 */
@Component
@RequiredArgsConstructor
public class AnswerSynthesizer {

    private static final String SYSTEM_PROMPT =
            "Bạn tổng hợp câu trả lời từ nhiều agent chuyên trách của trợ lý cuộc họp thành một câu trả lời mạch "
                    + "lạc, ngắn gọn bằng tiếng Việt cho người dùng. Chỉ dùng đúng nội dung các agent đã trả lời, "
                    + "không thêm thông tin mới, không suy đoán. Nếu có agent nào nói không có thông tin, hãy giữ "
                    + "nguyên ý đó thay vì bỏ qua.";

    private final OpenAiChatClient openAiChatClient;
    private final OpenAiProperties openAiProperties;

    public String synthesize(String question, Map<AgentType, String> answersByAgent) {
        StringBuilder sb = new StringBuilder();
        sb.append("<cau_hoi_goc>").append(question).append("</cau_hoi_goc>\n");
        answersByAgent.forEach((type, answer) -> sb.append("<tra_loi_cua agent=\"")
                .append(type.getLabel()).append("\">").append(answer).append("</tra_loi_cua>\n"));

        return openAiChatClient.chat(openAiProperties.synthesisModel(), SYSTEM_PROMPT, null, sb.toString());
    }
}
