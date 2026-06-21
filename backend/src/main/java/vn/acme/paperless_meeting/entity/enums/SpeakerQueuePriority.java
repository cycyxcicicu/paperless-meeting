package vn.acme.paperless_meeting.entity.enums;

public enum SpeakerQueuePriority {
    CHAIR_OVERRIDE("CHAIR_OVERRIDE", "Chủ trì ưu tiên"),
    NORMAL("NORMAL", "Thường");

    private final String code;
    private final String description;

    SpeakerQueuePriority(String code, String description) {
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
