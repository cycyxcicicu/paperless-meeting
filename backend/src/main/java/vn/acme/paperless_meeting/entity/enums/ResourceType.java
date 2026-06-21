package vn.acme.paperless_meeting.entity.enums;


// - MEETING: Cuộc họp, bao gồm thông tin về cuộc họp, thời gian, địa điểm, người tham gia, v.v.
// - DOCUMENT: Tài liệu, bao gồm các tệp đính kèm, tài liệu liên quan đến cuộc họp, v.v.
// - MINUTES: Biên bản cuộc họp, ghi lại nội dung cuộc họp, quyết định, hành động, v.v.
// - VOTE_SESSION: Phiên bỏ phiếu, bao gồm thông tin về phiên bỏ phiếu, các tùy chọn bỏ phiếu, kết quả bỏ phiếu, v.v.
// - AGENDA: Nội dung cuộc họp, bao gồm các mục trong nội dung cuộc họp của cuộc họp, thời gian dự kiến, người trình bày, v.v.
// - VOTE: Phiếu bỏ phiếu, bao gồm thông tin về phiếu bỏ phiếu, người bỏ phiếu, lựa chọn bỏ phiếu, v.v.
// - NOTIFICATION: Thông báo, bao gồm các thông báo liên quan đến cuộc họp, tài liệu, biên bản, v.v., giúp người dùng nhận được thông tin cập nhật về các sự kiện quan trọng trong hệ thống.
public enum ResourceType {
    MEETING("MEETING", "Cuộc họp"),
    DOCUMENT("DOCUMENT", "Tài liệu"),
    MINUTES("MINUTES", "Biên bản"),
    VOTE_SESSION("VOTE_SESSION", "Phiên bỏ phiếu"),
    AGENDA("AGENDA", "Nội dung cuộc họp"),
    VOTE("VOTE", "Biểu quyết"),
    NOTIFICATION("NOTIFICATION", "Thông báo"),
    SPEAKER("SPEAKER", "Người phát biểu"),
    PARTICIPANT("PARTICIPANT", "Đại biểu tham dự"),
    MOTION("MOTION", "Vấn đề biểu quyết");

    private final String code;
    private final String description;

    ResourceType(String code, String description) {
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
