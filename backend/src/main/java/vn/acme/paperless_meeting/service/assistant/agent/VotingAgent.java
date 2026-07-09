package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.service.assistant.OpenAiChatClient;
import vn.acme.paperless_meeting.service.assistant.context.VotingSlice;

@Component
public class VotingAgent extends AbstractSpecialistAgent {

    private static final String ROLE = "Bạn là trợ lý AI phụ trách BIỂU QUYẾT của một cuộc họp cụ thể, trả lời "
            + "cho người tham dự.";

    private static final String INPUT = "Các phiên biểu quyết trong thẻ <danh_sach_bieu_quyet>, mỗi phiên có: "
            + "noi_dung, de_xuat, trang_thai, loai, ket_qua (Đã thông qua/Không được thông qua/Chưa có kết quả), "
            + "và từng <lua_chon> với nhan/so_phieu/ty_le (% đã tính sẵn). LƯU Ý QUAN TRỌNG: đây CHỈ LÀ số liệu "
            + "TỔNG HỢP theo từng lựa chọn - hệ thống KHÔNG cung cấp cho bạn thông tin cá nhân nào đã chọn phương "
            + "án nào (không có ở bất kỳ phiên nào, kể cả phiên biểu quyết công khai), vì đây là giới hạn của "
            + "chính dữ liệu được cấp cho bạn, không phải do bạn từ chối trả lời.";

    private static final String STEPS = "# QUY TẮC TRẢ LỜI RIÊNG\n"
            + "Khi trả lời về kết quả một phiên biểu quyết cụ thể, LUÔN nêu đủ 3 phần: noi_dung (agenda item nào), "
            + "de_xuat (tên đề xuất), và ket_qua + các lua_chon chính - không trả lời cộc lốc chỉ mỗi con số.";

    private static final String EXPECTATION = "Trả lời ngắn gọn, đầy đủ nội dung/đề xuất/kết quả, chính xác.";

    private static final String FEW_SHOT = "- \"biểu quyết xong chưa\", \"kết quả sao rồi\", \"vote thế nào\" → "
            + "đọc ket_qua + từng lua_chon.\n"
            + "- \"bao nhiêu % đồng ý/tán thành\" → đọc ty_le của lựa chọn tương ứng (tên lựa chọn có thể là "
            + "\"Đồng ý\", \"Tán thành\"... tùy dữ liệu thực tế).\n"
            + "- \"đề xuất nào bị bác/không qua\" → lọc ket_qua=\"Không được thông qua\".\n"
            + "- \"còn phiên nào chưa biểu quyết\" → lọc ket_qua=\"Chưa có kết quả\".\n\n"

            + "# VÍ DỤ VỀ KẾT QUẢ LỌC RỖNG / MỨC CHI TIẾT KHÔNG ĐỦ (áp dụng Bước 3 của # CÁC BƯỚC SUY LUẬN)\n"
            + "- Hỏi \"ai đã bỏ phiếu cho phương án X\", \"ai vote đồng ý\", \"ai chưa biểu quyết\" (đòi danh tính "
            + "từng người) → đây là câu hỏi ở mức chi tiết CAO HƠN dữ liệu đang có. Trả lời rõ: \"Dữ liệu chỉ có "
            + "kết quả tổng hợp theo từng lựa chọn (số phiếu/tỷ lệ %), không có thông tin từng người đã bỏ phiếu "
            + "cho phương án nào.\" TUYỆT ĐỐI không suy đoán danh tính từ số phiếu/tỷ lệ, và không trả lời chung "
            + "chung \"không có trong dữ liệu\" (vì kết quả biểu quyết vẫn có, chỉ là không chia theo từng "
            + "người).\n"
            + "- Hỏi \"còn phiên nào chưa biểu quyết\" mà mọi phiên đều đã có ket_qua khác \"Chưa có kết quả\" → "
            + "trả lời \"Tất cả các phiên đều đã có kết quả.\" (kết quả lọc rỗng hợp lệ, không phải thiếu dữ "
            + "liệu).\n"
            + "- Hỏi \"đề xuất nào bị bác\" mà không phiên nào có ket_qua=\"Không được thông qua\" → trả lời "
            + "\"Không có đề xuất nào bị bác.\"";

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
    protected String buildContext(UUID meetingId, UUID callerId) {
        return slice.build(meetingId);
    }

    @Override
    protected String systemPrompt() {
        return getSystemPrompt(ROLE, INPUT, STEPS, EXPECTATION, FEW_SHOT);
    }
}
