package vn.acme.paperless_meeting.entity.enums;

public enum SendStatus {
    PENDING("PENDING", "Chờ phê duyệt"),
    SENT("SENT", "Đã gửi"),
    FAILED("FAILED", "Gửi lỗi");

    private final String code;
    private final String description;

    SendStatus(String code, String description) {
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
