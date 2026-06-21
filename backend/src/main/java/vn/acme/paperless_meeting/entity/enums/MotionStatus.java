package vn.acme.paperless_meeting.entity.enums;

public enum MotionStatus {
    DRAFT("DRAFT", "Bản nháp"),
    SUBMITTED("SUBMITTED", "Đã trình"),
    WITHDRAWN("WITHDRAWN", "Đã rút"),
    CLOSED("CLOSED", "Đã kết thúc");

    private final String code;
    private final String description;

    MotionStatus(String code, String description) {
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
