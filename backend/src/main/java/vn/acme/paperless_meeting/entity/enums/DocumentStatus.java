package vn.acme.paperless_meeting.entity.enums;

public enum DocumentStatus {
    DRAFT("DRAFT", "Bản nháp"),
    IN_REVIEW("IN_REVIEW", "Đang soát xét"),
    APPROVED("APPROVED", "Đã phê duyệt"),
    PUBLISHED("PUBLISHED", "Đã ban hành"),
    ARCHIVED("ARCHIVED", "Đã lưu trữ");

    private final String code;
    private final String description;

    DocumentStatus(String code, String description) {
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
