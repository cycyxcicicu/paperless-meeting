package vn.acme.paperless_meeting.entity.enums;

public enum MinutesStatus {
    DRAFT("DRAFT", "Bản nháp"),
    SUBMITTED("SUBMITTED", "Đã trình"),
    APPROVED("APPROVED", "Đã phê duyệt"),
    PUBLISHED("PUBLISHED", "Đã ban hành");

    private final String code;
    private final String description;

    MinutesStatus(String code, String description) {
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
