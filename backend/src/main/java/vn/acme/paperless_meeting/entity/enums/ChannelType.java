package vn.acme.paperless_meeting.entity.enums;

public enum ChannelType {
    APP("APP", "Ứng dụng"),
    EMAIL("EMAIL", "Email"),
    SMS("SMS", "Tin nhắn SMS");

    private final String code;
    private final String description;

    ChannelType(String code, String description) {
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
