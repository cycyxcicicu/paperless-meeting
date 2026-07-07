package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.service.assistant.OpenAiChatClient;
import vn.acme.paperless_meeting.service.assistant.context.MinutesOpinionSlice;

@Component
public class MinutesOpinionAgent extends AbstractSpecialistAgent {

    private final MinutesOpinionSlice slice;

    public MinutesOpinionAgent(OpenAiChatClient openAiChatClient, OpenAiProperties openAiProperties, MinutesOpinionSlice slice) {
        super(openAiChatClient, openAiProperties);
        this.slice = slice;
    }

    @Override
    public AgentType type() {
        return AgentType.MINUTES_OPINION;
    }

    @Override
    protected String buildContext(UUID meetingId) {
        return slice.build(meetingId);
    }

    @Override
    protected String systemPrompt() {
        return BASE_SAFETY_PROMPT
                + " Bạn chuyên trả lời về biên bản họp, ý kiến đóng góp, ai đã phát biểu về nội dung nào, và các "
                + "góp ý/hướng dẫn chỉnh sửa cho từng nội dung chương trình họp.";
    }
}
