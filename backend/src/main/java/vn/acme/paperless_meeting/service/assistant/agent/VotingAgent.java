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

    private static final String INPUT = "Thẻ <cuoc_hop trang_thai=\"...\"> cho biết cuộc họp ĐÃ DIỄN RA HAY CHƯA - "
            + "phiên biểu quyết chỉ có thể diễn ra SAU KHI cuộc họp đã bắt đầu (trang_thai=\"Đang tiến hành\" "
            + "hoặc \"Đã kết thúc\"). Nếu trang_thai KHÁC 2 giá trị đó thì cuộc họp CHƯA diễn ra.\n\n"
            + "Các phiên biểu quyết trong thẻ <danh_sach_bieu_quyet>, mỗi phiên có: "
            + "noi_dung, de_xuat, trang_thai, loai, ket_qua (Đã thông qua/Không được thông qua/Chưa có kết quả), "
            + "xem_duoc_ai_bo_phieu (Có/Không), và từng <lua_chon> với nhan/so_phieu/ty_le (% đã tính sẵn). "
            + "PHÂN BIỆT RÕ 2 TRỤC DỮ LIỆU KHÁC NHAU của một phiên, KHÔNG được lẫn lộn: (1) trang_thai = TIẾN "
            + "TRÌNH của phiên (\"Đã lên lịch\" nghĩa là CHƯA mở/chưa bắt đầu; \"Đang mở\" nghĩa là đã bắt đầu, "
            + "còn nhận phiếu; \"Đã kết thúc\" nghĩa là đã đóng phiên; \"Đã hủy\"); (2) ket_qua = KẾT QUẢ kiểm "
            + "phiếu (chỉ có ý nghĩa xác định khi phiên đã \"Đã kết thúc\" - phiên \"Đang mở\" hay \"Đã lên "
            + "lịch\" đều hiển thị ket_qua=\"Chưa có kết quả\" nhưng vì 2 LÝ DO KHÁC NHAU: một cái đang mở/đã bắt "
            + "đầu nhận phiếu, một cái còn chưa bắt đầu).\n\n"
            + "VỀ THÔNG TIN AI ĐÃ BỎ PHIẾU GÌ (RẤT QUAN TRỌNG - LIÊN QUAN QUYỀN RIÊNG TƯ): xem_duoc_ai_bo_phieu "
            + "cho biết NGƯỜI ĐANG HỎI (không phải người khác) có quyền xem chi tiết từng cá nhân đã chọn phương "
            + "án nào của phiên NÀY hay không - quyền này do hệ thống tính sẵn theo đúng quy tắc thật (Chủ trì/"
            + "Thư ký của cuộc họp LUÔN xem được; người khác chỉ xem được khi phiên đó đã bật công khai danh "
            + "sách). Nếu xem_duoc_ai_bo_phieu=\"Có\" → phiên đó có thêm các thẻ con <nguoi_bo_phieu ho_ten=\"...\" "
            + "lua_chon=\"...\"/>, dùng đúng các thẻ này để trả lời ai đã bỏ phiếu gì. Nếu xem_duoc_ai_bo_phieu="
            + "\"Không\" → phiên đó KHÔNG có thẻ <nguoi_bo_phieu> nào cả (không phải vì thiếu dữ liệu, mà vì "
            + "NGƯỜI HỎI không có quyền xem chi tiết theo từng cá nhân của phiên đó).";

    private static final String STEPS = "# QUY TẮC TRẢ LỜI RIÊNG\n"
            + "Khi trả lời về kết quả một phiên biểu quyết cụ thể, LUÔN nêu đủ 3 phần: noi_dung (agenda item nào), "
            + "de_xuat (tên đề xuất), và ket_qua + các lua_chon chính - không trả lời cộc lốc chỉ mỗi con số.";

    private static final String EXPECTATION = "Trả lời ngắn gọn, đầy đủ nội dung/đề xuất/kết quả, chính xác.";

    private static final String FEW_SHOT = "- \"biểu quyết xong chưa\", \"kết quả sao rồi\", \"vote thế nào\" → "
            + "đọc ket_qua + từng lua_chon.\n"
            + "- \"bao nhiêu % đồng ý/tán thành\" → đọc ty_le của lựa chọn tương ứng (tên lựa chọn có thể là "
            + "\"Đồng ý\", \"Tán thành\"... tùy dữ liệu thực tế).\n"
            + "- \"đề xuất nào bị bác/không qua\" → lọc ket_qua=\"Không được thông qua\".\n"
            + "- \"còn phiên nào chưa biểu quyết\", \"phiên nào chưa có kết quả\" → lọc ket_qua=\"Chưa có kết "
            + "quả\" (gồm CẢ trang_thai=\"Đang mở\" LẪN trang_thai=\"Đã lên lịch\" - câu hỏi này không phân biệt "
            + "2 loại, chỉ quan tâm chưa CÓ KẾT QUẢ).\n"
            + "- \"phiên nào đang mở\", \"phiên nào đang biểu quyết\" (hỏi CỤ THỂ về trạng thái mở) → lọc CHỈ "
            + "trang_thai=\"Đang mở\".\n"
            + "- \"phiên nào CHƯA mở\", \"phiên nào chưa bắt đầu/chưa diễn ra\", \"phiên nào sắp tới\" (hỏi CỤ "
            + "THỂ về việc CHƯA bắt đầu, khác với \"chưa có kết quả\") → lọc CHỈ trang_thai=\"Đã lên lịch\" - "
            + "TUYỆT ĐỐI không tính phiên trang_thai=\"Đang mở\" vào nhóm \"chưa mở\", vì phiên đó ĐÃ mở rồi (chỉ "
            + "là chưa có kết quả).\n"
            + "- \"phiên nào đã đóng/đã kết thúc\" → lọc trang_thai=\"Đã kết thúc\".\n\n"

            + "# VÍ DỤ VỀ KẾT QUẢ LỌC RỖNG / MỨC CHI TIẾT KHÔNG ĐỦ (áp dụng Bước 3 của # CÁC BƯỚC SUY LUẬN)\n"
            + "- Hỏi \"ai đã bỏ phiếu cho phương án X\", \"người A đã vote gì\", \"ai chưa biểu quyết\" (đòi danh "
            + "tính từng người của MỘT phiên cụ thể) → xem xem_duoc_ai_bo_phieu của phiên đó TRƯỚC:\n"
            + "  + Nếu \"Có\" → đọc các <nguoi_bo_phieu> của phiên đó để trả lời chính xác (vd: tìm ho_ten khớp "
            + "\"A\" rồi đọc lua_chon của đúng dòng đó). Nếu hỏi về một người mà không có <nguoi_bo_phieu> nào "
            + "khớp tên → trả lời \"[Tên] chưa bỏ phiếu cho phiên này.\" (không phải từ chối vì thiếu quyền).\n"
            + "  + Nếu \"Không\" → TUYỆT ĐỐI KHÔNG trả lời \"dữ liệu không có thông tin này\"/\"chỉ có số liệu "
            + "tổng hợp\" - phải nói THẲNG lý do thật: \"Bạn không có quyền xem ai đã bỏ phiếu cho phương án nào "
            + "của phiên này (chỉ Chủ trì/Thư ký hoặc khi phiên bật công khai danh sách mới xem được).\"\n"
            + "- Hỏi \"còn phiên nào chưa biểu quyết\" mà mọi phiên đều đã có ket_qua khác \"Chưa có kết quả\" → "
            + "trả lời \"Tất cả các phiên đều đã có kết quả.\" (kết quả lọc rỗng hợp lệ, không phải thiếu dữ "
            + "liệu).\n"
            + "- Hỏi \"đề xuất nào bị bác\" mà không phiên nào có ket_qua=\"Không được thông qua\" → trả lời "
            + "\"Không có đề xuất nào bị bác.\"\n"
            + "- Hỏi \"còn phiên nào CHƯA MỞ không\" - PHẢI rà lại trang_thai của TỪNG phiên trong "
            + "<danh_sach_bieu_quyet>, không được trả lời mặc định: nếu CÓ ít nhất 1 phiên trang_thai=\"Đã lên "
            + "lịch\" → trả lời CÓ và nêu rõ đề xuất đó (vd: \"Có, phiên biểu quyết về '...' vẫn đang ở trạng "
            + "thái đã lên lịch, chưa mở.\"); CHỈ khi không phiên nào trang_thai=\"Đã lên lịch\" → trả lời \"Tất "
            + "cả các phiên đều đã được mở.\"\n"
            + "- Hỏi bất kỳ câu nào về biểu quyết (\"biểu quyết xong chưa\", \"có phiên nào không\", \"kết quả "
            + "biểu quyết\"...) mà <danh_sach_bieu_quyet> HOÀN TOÀN RỖNG (không một <phien_bieu_quyet> nào cả): "
            + "LUÔN kiểm tra trang_thai của <cuoc_hop> trước khi trả lời:\n"
            + "  + Nếu trang_thai KHÁC \"Đang tiến hành\"/\"Đã kết thúc\" (cuộc họp CHƯA diễn ra) → trả lời \"Cuộc "
            + "họp chưa diễn ra, nên chưa có phiên biểu quyết nào được tạo.\" - PHẢI nêu rõ lý do chưa diễn ra, "
            + "không chỉ nói suông \"chưa có phiên biểu quyết nào\".\n"
            + "  + Nếu trang_thai ĐÃ là \"Đang tiến hành\"/\"Đã kết thúc\" mà vẫn không có phiên nào → trả lời "
            + "\"Cuộc họp này chưa có phiên biểu quyết nào được tạo.\" (lý do khác: họp đã diễn ra nhưng đơn giản "
            + "là không có nội dung nào cần biểu quyết).\n"
            + "  TUYỆT ĐỐI KHÔNG trả lời \"Thông tin này không có trong dữ liệu\" trong cả 2 trường hợp trên (đó "
            + "là câu dành cho THIẾU TRƯỜNG DỮ LIỆU, còn đây là danh sách phiên biểu quyết có tồn tại nhưng đang "
            + "trống - hai tình huống khác nhau).";

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
        return slice.build(meetingId, callerId);
    }

    @Override
    protected String systemPrompt() {
        return getSystemPrompt(ROLE, INPUT, STEPS, EXPECTATION, FEW_SHOT);
    }
}
