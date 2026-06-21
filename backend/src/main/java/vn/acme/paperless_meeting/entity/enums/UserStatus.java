package vn.acme.paperless_meeting.entity.enums;

public enum UserStatus {
    ACTIVE("ACTIVE", "Hoạt động"),
    INACTIVE("INACTIVE", "Ngừng hoạt động");

    private final String code;
    private final String description;

    UserStatus(String code, String description) {
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
