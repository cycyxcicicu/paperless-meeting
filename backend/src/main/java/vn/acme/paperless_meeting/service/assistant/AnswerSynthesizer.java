package vn.acme.paperless_meeting.service.assistant;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

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
                    + "lạc, ngắn gọn bằng tiếng Việt cho người dùng.\n\n"
                    + "QUY TẮC BẮT BUỘC:\n"
                    + "1. CHỈ được dùng đúng nguyên văn thông tin đã có trong các thẻ <tra_loi_cua agent=\"...\">. "
                    + "TUYỆT ĐỐI KHÔNG thêm bất kỳ sự kiện, tên riêng, địa điểm, con số nào KHÔNG xuất hiện nguyên "
                    + "văn trong các thẻ đó, dù nghe có vẻ hợp lý hay quen thuộc đến đâu - đây là hành vi BỊA và bị "
                    + "NGHIÊM CẤM tuyệt đối, kể cả khi bạn chỉ đang cố \"làm mượt\" câu văn.\n"
                    + "2. Với MỖI thẻ <tra_loi_cua>, chỉ có 2 việc được làm: (a) giữ nguyên ý của câu trả lời đó "
                    + "(kể cả khi câu trả lời là từ chối/không có dữ liệu - PHẢI giữ nguyên ý từ chối đó, không "
                    + "được thay bằng thông tin khác), hoặc (b) diễn đạt lại cho ngắn gọn/mạch lạc hơn NHƯNG không "
                    + "đổi nghĩa. KHÔNG được bỏ sót câu trả lời của bất kỳ agent nào.\n"
                    + "3. Nếu không chắc một chi tiết có thực sự nằm trong <tra_loi_cua> hay không, KHÔNG đưa chi "
                    + "tiết đó vào câu trả lời cuối cùng.\n"
                    + "4. Sắp xếp các phần trả lời theo đúng thứ tự các ý được hỏi trong <cau_hoi_goc>, không xáo "
                    + "trộn.\n"
                    + "5. Không nhắc tên nhân vật nổi tiếng/lịch sử, không chủ động bàn về chính trị/tôn giáo/tình "
                    + "dục/ma túy - kể cả khi câu trả lời gốc của agent nào đó vô tình có nội dung ngoài lề, chỉ "
                    + "giữ lại phần liên quan trực tiếp tới câu hỏi cuộc họp.";

    private final OpenAiChatClient openAiChatClient;
    private final OpenAiProperties openAiProperties;

    public String synthesize(String question, Map<AgentType, String> answersByAgent) {
        String userMessage = buildUserMessage(question, answersByAgent);
        return openAiChatClient.chat(openAiProperties.synthesisModel(), SYSTEM_PROMPT, null, userMessage);
    }

    /**
     * Giống {@link #synthesize}, nhưng phát từng đoạn chữ qua onDelta ngay khi model
     * sinh ra (dùng khi câu hỏi ghép từ 2 agent trở lên - phần tổng hợp cuối cùng này
     * mới là nội dung người dùng thực sự nhìn thấy nên mới cần streaming).
     */
    public String synthesizeStream(String question, Map<AgentType, String> answersByAgent,
            Consumer<String> onDelta, AtomicBoolean cancelled) {
        String userMessage = buildUserMessage(question, answersByAgent);
        return openAiChatClient.chatStream(openAiProperties.synthesisModel(), SYSTEM_PROMPT, null, userMessage,
                onDelta, cancelled);
    }

    private String buildUserMessage(String question, Map<AgentType, String> answersByAgent) {
        StringBuilder sb = new StringBuilder();
        sb.append("<cau_hoi_goc>").append(question).append("</cau_hoi_goc>\n");
        answersByAgent.forEach((type, answer) -> sb.append("<tra_loi_cua agent=\"")
                .append(type.getLabel()).append("\">").append(answer).append("</tra_loi_cua>\n"));
        return sb.toString();
    }
}
