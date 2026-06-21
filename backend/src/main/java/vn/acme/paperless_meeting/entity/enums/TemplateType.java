package vn.acme.paperless_meeting.entity.enums;

public enum TemplateType {
    INVITATION("INVITATION", "Thư mời"),
    MINUTES("MINUTES", "Biên bản"),
    AGENDA("AGENDA", "Nội dung cuộc họp"),
    RESOLUTION("RESOLUTION", "Nghị quyết");

    private final String code;
    private final String description;

    TemplateType(String code, String description) {
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
