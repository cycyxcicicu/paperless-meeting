package vn.acme.paperless_meeting.entity.enums;

public enum VoteSessionStatus {
    SCHEDULED("SCHEDULED", "Đã lên lịch"),
    OPEN("OPEN", "Đang mở"),
    CLOSED("CLOSED", "Đã kết thúc"),
    CANCELLED("CANCELLED", "Đã hủy");

    private final String code;
    private final String description;

    VoteSessionStatus(String code, String description) {
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
