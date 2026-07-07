package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.service.assistant.OpenAiChatClient;
import vn.acme.paperless_meeting.service.assistant.context.VotingSlice;

@Component
public class VotingAgent extends AbstractSpecialistAgent {

    private final VotingSlice slice;

    public VotingAgent(OpenAiChatClient openAiChatClient, OpenAiProperties openAiProperties, VotingSlice slice) {
        super(openAiChatClient, openAiProperties);
        this.slice = slice;
    }

    @Override
    public AgentType type() {
        return AgentType.VOTING;
    }

    @Override
    protected String buildContext(UUID meetingId) {
        return slice.build(meetingId);
    }

    @Override
    protected String systemPrompt() {
        return BASE_SAFETY_PROMPT
                + " Bạn chuyên trả lời về biểu quyết: đề xuất nào được đưa ra biểu quyết, kết quả từng lựa chọn "
                + "kèm tỷ lệ % (đã tính sẵn trong dữ liệu), đề xuất nào được thông qua hay không.";
    }
}
