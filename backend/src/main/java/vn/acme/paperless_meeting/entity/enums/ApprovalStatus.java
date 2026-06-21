package vn.acme.paperless_meeting.entity.enums;

public enum ApprovalStatus {
    PENDING("PENDING", "Chờ phê duyệt"),
    APPROVED("APPROVED", "Đã phê duyệt"),
    REJECTED("REJECTED", "Từ chối"),
    CANCELLED("CANCELLED", "Đã hủy");

    private final String code;
    private final String description;

    ApprovalStatus(String code, String description) {
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
