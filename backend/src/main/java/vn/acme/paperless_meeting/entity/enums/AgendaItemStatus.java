package vn.acme.paperless_meeting.entity.enums;

public enum AgendaItemStatus {
    DRAFT("DRAFT", "Bản nháp"),
    PENDING_PREPARATION("PENDING_PREPARATION", "Chờ chuẩn bị"),
    PENDING_APPROVAL("PENDING_APPROVAL", "Chờ phê duyệt"),
    APPROVED("APPROVED", "Đã phê duyệt"),
    REJECTED("REJECTED", "Từ chối"),
    IN_PROGRESS("IN_PROGRESS", "Đang tiến hành"),
    DONE("DONE", "Đã hoàn thành"),
    SKIPPED("SKIPPED", "Bỏ qua");

    private final String code;
    private final String description;

    AgendaItemStatus(String code, String description) {
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
