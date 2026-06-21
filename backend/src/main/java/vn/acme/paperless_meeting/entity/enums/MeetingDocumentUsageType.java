package vn.acme.paperless_meeting.entity.enums;

public enum MeetingDocumentUsageType {
    AGENDA("AGENDA", "Nội dung cuộc họp"),
    APPENDIX("APPENDIX", "Phụ lục"),
    MINUTES_ATTACHMENT("MINUTES_ATTACHMENT", "Tài liệu đính kèm biên bản");

    private final String code;
    private final String description;

    MeetingDocumentUsageType(String code, String description) {
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
