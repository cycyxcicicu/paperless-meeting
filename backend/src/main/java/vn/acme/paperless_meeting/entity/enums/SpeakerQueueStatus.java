package vn.acme.paperless_meeting.entity.enums;

public enum SpeakerQueueStatus {
    QUEUED("QUEUED", "Đang xếp hàng"),
    SPEAKING("SPEAKING", "Đang phát biểu"),
    DONE("DONE", "Đã hoàn thành"),
    CANCELLED("CANCELLED", "Đã hủy"),
    REJECTED("REJECTED", "Từ chối"),
    EXPIRED("EXPIRED", "Đã hết hạn");

    private final String code;
    private final String description;

    SpeakerQueueStatus(String code, String description) {
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
