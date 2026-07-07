package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.service.assistant.OpenAiChatClient;
import vn.acme.paperless_meeting.service.assistant.context.MeetingInfoSlice;

@Component
public class MeetingInfoAgent extends AbstractSpecialistAgent {

    private final MeetingInfoSlice slice;

    public MeetingInfoAgent(OpenAiChatClient openAiChatClient, OpenAiProperties openAiProperties, MeetingInfoSlice slice) {
        super(openAiChatClient, openAiProperties);
        this.slice = slice;
    }

    @Override
    public AgentType type() {
        return AgentType.MEETING_INFO;
    }

    @Override
    protected String buildContext(UUID meetingId) {
        return slice.build(meetingId);
    }

    @Override
    protected String systemPrompt() {
        return BASE_SAFETY_PROMPT
                + " Bạn chuyên trả lời về: thông tin chung cuộc họp (thời gian, địa điểm, trạng thái), "
                + "chương trình họp (danh sách nội dung theo thứ tự), và thành phần tham dự - bao gồm ai vắng, "
                + "ai đến muộn (và muộn bao nhiêu phút), ai là khách mời, ai đã/chưa phát biểu. Các trường này đã "
                + "được tính sẵn trong dữ liệu (di_muon, da_phat_bieu, loai...), chỉ cần đọc và trả lời chính xác.";
    }
}
