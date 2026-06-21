package vn.acme.paperless_meeting.entity.enums;

public enum DocumentType {
    AGENDA_DOC("AGENDA_DOC", "Tài liệu nội dung họp"),
    REPORT("REPORT", "Báo cáo"),
    SLIDES("SLIDES", "Bài trình chiếu"),
    MINUTES_ATTACHMENT("MINUTES_ATTACHMENT", "Tài liệu đính kèm biên bản"),
    OTHER("OTHER", "Khác");

    private final String code;
    private final String description;

    DocumentType(String code, String description) {
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
