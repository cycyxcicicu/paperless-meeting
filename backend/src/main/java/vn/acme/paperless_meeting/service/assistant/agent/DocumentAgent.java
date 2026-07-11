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
            + "có: ten (tên file), thuoc_noi_dung, nguoi_chuan_bi (tên người được GIAO chuẩn bị tài liệu cho nội "
            + "dung đó, hoặc \"-\" nếu nội dung chưa được gán ai chuẩn bị), loai_su_dung, bao_mat, và "
            + "noi_dung_trich_xuat (nội dung văn bản đã trích xuất sẵn, hoặc ghi chú không trích được).";

    private static final String STEPS = "# QUY TẮC TRẢ LỜI RIÊNG\n"
            + "- Nếu noi_dung_trich_xuat ghi \"Không trích được nội dung\", hãy nói rõ điều đó (ví dụ: đây có thể "
            + "là bản scan hoặc định dạng chưa hỗ trợ) thay vì suy đoán nội dung file.";

    private static final String EXPECTATION = "Khi liệt kê tài liệu của một nội dung, nêu TÊN FILE trước, chỉ tóm "
            + "tắt nội dung nếu được hỏi thêm. Trả lời ngắn gọn, chính xác.";

    private static final String FEW_SHOT = "- \"nội dung 1 có file/tài liệu gì\", \"đính kèm gì cho nội dung 1\", "
            + "\"tài liệu liên quan/gửi kèm nội dung 1\" → CÙNG Ý NGHĨA, đều là hỏi: có <tai_lieu> nào với "
            + "thuoc_noi_dung khớp \"Nội dung 1\" hay không, BẤT KỂ loai_su_dung của tài liệu đó là gì (\"Nội dung "
            + "cuộc họp\"/\"Phụ lục\"/\"Tài liệu đính kèm biên bản\" đều tính là có tài liệu, vì đây chỉ là loại "
            + "hình thức lưu trữ nội bộ, người hỏi không phân biệt các loại này) → nếu có, liệt kê ten của TẤT CẢ "
            + "<tai_lieu> có thuoc_noi_dung khớp, không được bỏ sót chỉ vì loai_su_dung không phải \"Phụ lục\".\n"
            + "- \"tóm tắt tài liệu X\", \"file X nói về gì\" → đọc noi_dung_trich_xuat của tài liệu có ten khớp "
            + "gần đúng với X (tên file có thể dài/khác biệt nhỏ, hãy đối chiếu linh hoạt) rồi tóm tắt.\n"
            + "- \"số liệu Y nằm ở file nào\", \"cái này ghi trong file nào\" (hỏi NGƯỢC - biết nội dung, tìm tên "
            + "file chứa nó) → tìm trong noi_dung_trich_xuat của TỪNG tài liệu xem cái nào chứa thông tin khớp với "
            + "Y, trả lời đúng TÊN FILE đó (không phải tóm tắt).\n"
            + "- \"có tài liệu mật không\" → lọc bao_mat=\"Có\".\n"
            + "- \"tài liệu/nội dung X do ai chuẩn bị\", \"ai chuẩn bị tài liệu này\", \"tài liệu này của ai\" "
            + "(hỏi ĐỊNH DANH người phụ trách chuẩn bị - KHÔNG hỏi nội dung trao đổi/phản hồi/lý do từ chối) → chỉ "
            + "cần đọc nguoi_chuan_bi của <tai_lieu> khớp, trả lời thẳng tên đó (vd: \"Tài liệu 'Báo cáo...' do "
            + "Nguyễn Văn A chuẩn bị.\"); nếu nguoi_chuan_bi=\"-\" → trả lời \"Nội dung này chưa được gán người "
            + "chuẩn bị.\" TUYỆT ĐỐI KHÔNG tự suy ra người chuẩn bị từ tên người tạo cuộc họp hay bất kỳ ai khác "
            + "ngoài giá trị nguoi_chuan_bi. Câu hỏi kiểu này KHÔNG liên quan đến trao đổi/hướng dẫn/phản hồi khi "
            + "chuẩn bị tài liệu (đó là dữ liệu của Agent Biên bản - Ý kiến, không phải của bạn).\n\n"

            + "# VÍ DỤ VỀ KẾT QUẢ LỌC RỖNG (áp dụng Bước 3 của # CÁC BƯỚC SUY LUẬN) - ĐỌC KỸ, ĐÂY LÀ LỖI HAY GẶP\n"
            + "- Hỏi \"có tài liệu mật không\" mà không tài liệu nào có bao_mat=\"Có\" → trả lời \"Không có tài "
            + "liệu nào được đánh dấu mật.\" (không phải \"không có trong dữ liệu\").\n"
            + "- Câu hỏi \"nội dung X có tài liệu đính kèm không\" KHÔNG có một câu trả lời cố định - PHẢI kiểm "
            + "tra lại <danh_sach_tai_lieu> THỰC TẾ mỗi lần, không được mặc định trả lời \"chưa có\":\n"
            + "  + Nếu CÓ ít nhất một <tai_lieu> với thuoc_noi_dung=\"Nội dung X: ...\" (dù loai_su_dung là gì) → "
            + "trả lời CÓ, và nêu tên file đó ra (vd: \"Có, nội dung 5 có tài liệu: 'Đề án kiện toàn...'\"). Ví dụ: "
            + "nếu <tai_lieu ten=\"Đề án...\" thuoc_noi_dung=\"Nội dung 5: ...\" loai_su_dung=\"Nội dung cuộc "
            + "họp\"/> tồn tại thì đây CHÍNH LÀ tài liệu đính kèm của nội dung 5, không được nói \"không có\".\n"
            + "  + CHỈ khi thực sự KHÔNG có <tai_lieu> nào khớp thuoc_noi_dung đó → trả lời \"Nội dung này chưa "
            + "có tài liệu đính kèm.\"\n"
            + "- Hỏi bất kỳ câu nào về tài liệu (\"cuộc họp này có tài liệu không\", \"có hồ sơ đính kèm không\", "
            + "\"tài liệu về X nằm ở đâu\"...) mà <danh_sach_tai_lieu> HOÀN TOÀN RỖNG (không một <tai_lieu> nào cả, "
            + "không riêng gì nội dung X) → trả lời \"Cuộc họp này chưa có tài liệu nào được đính kèm.\" - TUYỆT "
            + "ĐỐI KHÔNG trả lời \"Thông tin này không có trong dữ liệu\" (đó là câu dành cho việc THIẾU TRƯỜNG DỮ "
            + "LIỆU, còn đây là danh sách tài liệu có tồn tại nhưng đang trống - hai tình huống khác nhau).";

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
