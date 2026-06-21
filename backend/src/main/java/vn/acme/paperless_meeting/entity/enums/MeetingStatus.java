package vn.acme.paperless_meeting.entity.enums;

public enum MeetingStatus {
    DRAFT("DRAFT", "Bản nháp"),
    PENDING_APPROVAL("PENDING_APPROVAL", "Chờ phê duyệt"),
    APPROVED("APPROVED", "Đã phê duyệt"),
    UPCOMING("UPCOMING", "Sắp diễn ra"),
    IN_PROGRESS("IN_PROGRESS", "Đang tiến hành"),
    CLOSED("CLOSED", "Đã kết thúc"),
    CANCELLED("CANCELLED", "Đã hủy"),
    REJECTED("REJECTED", "Từ chối"),
    EXPIRED("EXPIRED", "Đã hết hạn");

    private final String code;
    private final String description;

    MeetingStatus(String code, String description) {
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
