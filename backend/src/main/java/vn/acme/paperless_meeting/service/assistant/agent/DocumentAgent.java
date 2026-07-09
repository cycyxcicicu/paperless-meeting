package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.service.assistant.OpenAiChatClient;
import vn.acme.paperless_meeting.service.assistant.context.DocumentSlice;

@Component
public class DocumentAgent extends AbstractSpecialistAgent {

    private static final String ROLE = "Bạn là trợ lý AI phụ trách TÀI LIỆU của một cuộc họp cụ thể, trả lời cho "
            + "người tham dự.";

    private static final String INPUT = "Tài liệu đính kèm cuộc họp trong thẻ <danh_sach_tai_lieu>, mỗi tài liệu "
            + "có: ten (tên file), thuoc_noi_dung, loai_su_dung, bao_mat, và noi_dung_trich_xuat (nội dung văn bản "
            + "đã trích xuất sẵn, hoặc ghi chú không trích được).";

    private static final String STEPS = "# QUY TẮC TRẢ LỜI RIÊNG\n"
            + "- Nếu noi_dung_trich_xuat ghi \"Không trích được nội dung\", hãy nói rõ điều đó (ví dụ: đây có thể "
            + "là bản scan hoặc định dạng chưa hỗ trợ) thay vì suy đoán nội dung file.";

    private static final String EXPECTATION = "Khi liệt kê tài liệu của một nội dung, nêu TÊN FILE trước, chỉ tóm "
            + "tắt nội dung nếu được hỏi thêm. Trả lời ngắn gọn, chính xác.";

    private static final String FEW_SHOT = "- \"nội dung 1 có file/tài liệu gì\", \"đính kèm gì cho nội dung 1\" "
            + "→ liệt kê ten của các <tai_lieu> có thuoc_noi_dung khớp.\n"
            + "- \"tóm tắt tài liệu X\", \"file X nói về gì\" → đọc noi_dung_trich_xuat của tài liệu có ten khớp "
            + "gần đúng với X (tên file có thể dài/khác biệt nhỏ, hãy đối chiếu linh hoạt) rồi tóm tắt.\n"
            + "- \"số liệu Y nằm ở file nào\", \"cái này ghi trong file nào\" (hỏi NGƯỢC - biết nội dung, tìm tên "
            + "file chứa nó) → tìm trong noi_dung_trich_xuat của TỪNG tài liệu xem cái nào chứa thông tin khớp với "
            + "Y, trả lời đúng TÊN FILE đó (không phải tóm tắt).\n"
            + "- \"có tài liệu mật không\" → lọc bao_mat=\"Có\".\n\n"

            + "# VÍ DỤ VỀ KẾT QUẢ LỌC RỖNG (áp dụng Bước 3 của # CÁC BƯỚC SUY LUẬN)\n"
            + "- Hỏi \"có tài liệu mật không\" mà không tài liệu nào có bao_mat=\"Có\" → trả lời \"Không có tài "
            + "liệu nào được đánh dấu mật.\" (không phải \"không có trong dữ liệu\").\n"
            + "- Hỏi \"nội dung X có tài liệu đính kèm không\" mà không có <tai_lieu> nào khớp thuoc_noi_dung → "
            + "trả lời \"Nội dung này chưa có tài liệu đính kèm.\"";

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
    protected String buildContext(UUID meetingId, UUID callerId) {
        return slice.build(meetingId, callerId);
    }

    @Override
    protected String systemPrompt() {
        return getSystemPrompt(ROLE, INPUT, STEPS, EXPECTATION, FEW_SHOT);
    }
}
