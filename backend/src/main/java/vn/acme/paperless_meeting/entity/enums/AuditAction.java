package vn.acme.paperless_meeting.entity.enums;

public enum AuditAction {
    CREATE_MEETING("CREATE_MEETING", "Tạo cuộc họp"),
    UPDATE_MEETING("UPDATE_MEETING", "Cập nhật cuộc họp"),
    DELETE_MEETING("DELETE_MEETING", "Xóa cuộc họp"),
    CANCEL_MEETING("CANCEL_MEETING", "Hủy cuộc họp"),
    CLOSE_MEETING("CLOSE_MEETING", "Kết thúc cuộc họp"),
    UPLOAD_DOCUMENT("UPLOAD_DOCUMENT", "Tải lên tài liệu"),
    UPDATE_DOCUMENT("UPDATE_DOCUMENT", "Cập nhật tài liệu"),
    DELETE_DOCUMENT("DELETE_DOCUMENT", "Xóa tài liệu"),
    SUBMIT_APPROVAL("SUBMIT_APPROVAL", "Trình phê duyệt"),
    APPROVE_RESOURCE("APPROVE_RESOURCE", "Phê duyệt tài nguyên"),
    REJECT_RESOURCE("REJECT_RESOURCE", "Từ chối tài nguyên"),
    OPEN_VOTE("OPEN_VOTE", "Mở biểu quyết"),
    CLOSE_VOTE("CLOSE_VOTE", "Đóng biểu quyết"),
    PUBLISH_MINUTES("PUBLISH_MINUTES", "Ban hành biên bản"),
    LOGIN("LOGIN", "Đăng nhập"),
    ADD_PARTICIPANT("ADD_PARTICIPANT", "Thêm đại biểu tham dự"),
    REMOVE_PARTICIPANT("REMOVE_PARTICIPANT", "Xóa đại biểu tham dự"),
    UPDATE_AGENDA("UPDATE_AGENDA", "Cập nhật nội dung cuộc họp"),
    ATTACH_DOCUMENT("ATTACH_DOCUMENT", "Đính kèm tài liệu"),
    DETACH_DOCUMENT("DETACH_DOCUMENT", "Gỡ tài liệu"),
    REGISTER_SPEAKER("REGISTER_SPEAKER", "Đăng ký phát biểu"),
    CANCEL_SPEAKER_REQUEST("CANCEL_SPEAKER_REQUEST", "Hủy yêu cầu phát biểu"),
    REORDER_SPEAKER_QUEUE("REORDER_SPEAKER_QUEUE", "Sắp xếp lại hàng đợi phát biểu"),
    START_SPEAKER_TURN("START_SPEAKER_TURN", "Bắt đầu lượt phát biểu"),
    STOP_SPEAKER_TURN("STOP_SPEAKER_TURN", "Kết thúc lượt phát biểu"),
    CREATE_MOTION("CREATE_MOTION", "Tạo vấn đề biểu quyết"),
    UPDATE_MOTION("UPDATE_MOTION", "Cập nhật vấn đề biểu quyết"),
    DELETE_MOTION("DELETE_MOTION", "Xóa vấn đề biểu quyết"),
    CAST_VOTE("CAST_VOTE", "Thực hiện bỏ phiếu"),
    CHANGE_PARTICIPANT_ROLE("CHANGE_PARTICIPANT_ROLE", "Thay đổi vai trò người tham gia"),
    PARTICIPANT_CHECK_IN("PARTICIPANT_CHECK_IN", "Đại biểu điểm danh"),
    OTHER("OTHER", "Khác");

    private final String code;
    private final String description;

    AuditAction(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return this.code;
    }

    public String getDescription() {
        return this.description;
    }
}
