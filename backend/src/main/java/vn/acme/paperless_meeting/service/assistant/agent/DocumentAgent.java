package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.service.assistant.OpenAiChatClient;
import vn.acme.paperless_meeting.service.assistant.context.DocumentSlice;

@Component
public class DocumentAgent extends AbstractSpecialistAgent {

    private final DocumentSlice slice;

    public DocumentAgent(OpenAiChatClient openAiChatClient, OpenAiProperties openAiProperties, DocumentSlice slice) {
        super(openAiChatClient, openAiProperties);
        this.slice = slice;
    }

    @Override
    public AgentType type() {
        return AgentType.DOCUMENT;
    }

    @Override
    protected String buildContext(UUID meetingId) {
        return slice.build(meetingId);
    }

    @Override
    protected String systemPrompt() {
        return BASE_SAFETY_PROMPT
                + " Bạn chuyên trả lời về tài liệu cuộc họp: tài liệu nào gắn với nội dung nào, tóm tắt nội dung "
                + "tài liệu, tìm số liệu/thông tin cụ thể trong tài liệu. Nếu tài liệu ghi chú không trích được nội "
                + "dung (bản scan hoặc định dạng chưa hỗ trợ), hãy nói rõ điều đó thay vì suy đoán nội dung.";
    }
}
