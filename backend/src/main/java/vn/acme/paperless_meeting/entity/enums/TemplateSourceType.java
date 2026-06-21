package vn.acme.paperless_meeting.entity.enums;

public enum TemplateSourceType {
    MEETING("MEETING", "Cuộc họp"),
    USER("USER", "User"),
    DEPARTMENT("DEPARTMENT", "Department"),
    MINUTES("MINUTES", "Biên bản"),
    AGENDA("AGENDA", "Nội dung cuộc họp"),
    VOTE("VOTE", "Biểu quyết");

    private final String code;
    private final String description;

    TemplateSourceType(String code, String description) {
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
