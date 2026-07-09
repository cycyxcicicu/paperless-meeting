package vn.acme.paperless_meeting.entity.enums;

public enum AssistantMessageRole {
    USER("USER", "Người dùng"),
    ASSISTANT("ASSISTANT", "Trợ lý AI");

    private final String code;
    private final String description;

    AssistantMessageRole(String code, String description) {
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
