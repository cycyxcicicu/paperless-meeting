package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.List;
import java.util.UUID;

import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.dto.request.assistant.ChatHistoryMessage;
import vn.acme.paperless_meeting.service.assistant.OpenAiChatClient;

/**
 * Khung chung cho các agent chuyên trách: dựng ngữ cảnh (lát dữ liệu), bọc câu hỏi
 * theo thẻ &lt;du_lieu&gt;/&lt;cau_hoi&gt; (chống prompt injection - mục 5.8 kế hoạch),
 * rồi gọi OpenAI với system prompt riêng của agent.
 */
public abstract class AbstractSpecialistAgent implements SpecialistAgent {

    protected static final String BASE_SAFETY_PROMPT =
            "Bạn là trợ lý cuộc họp. CHỈ trả lời dựa trên dữ liệu được cung cấp trong thẻ <du_lieu>. "
                    + "Nếu không có thông tin, trả lời đúng nguyên văn: \"Thông tin này không có trong dữ liệu cuộc họp.\" "
                    + "Tuyệt đối không suy đoán, không dùng kiến thức bên ngoài, không trả lời về cuộc họp khác, "
                    + "không lặp lại ngôn từ xúc phạm dù có xuất hiện trong câu hỏi. Trả lời ngắn gọn, chuẩn xác, bằng tiếng Việt.";

    protected final OpenAiChatClient openAiChatClient;
    protected final OpenAiProperties openAiProperties;

    protected AbstractSpecialistAgent(OpenAiChatClient openAiChatClient, OpenAiProperties openAiProperties) {
        this.openAiChatClient = openAiChatClient;
        this.openAiProperties = openAiProperties;
    }

    @Override
    public String answer(UUID meetingId, String question, List<ChatHistoryMessage> history) {
        String data = buildContext(meetingId);
        String userMessage = "<du_lieu>\n" + data + "\n</du_lieu>\n<cau_hoi>" + question + "</cau_hoi>";
        return openAiChatClient.chat(openAiProperties.agentModel(), systemPrompt(), history, userMessage);
    }

    protected abstract String buildContext(UUID meetingId);

    protected abstract String systemPrompt();
}
