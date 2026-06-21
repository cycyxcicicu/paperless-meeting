package vn.acme.paperless_meeting.entity.enums;

public enum ParticipantRole {
    CHAIR("CHAIR", "Chủ trì"),
    SECRETARY("SECRETARY", "Thư ký"),
    PARTICIPANT("PARTICIPANT", "Đại biểu tham dự"),
    GUEST("GUEST", "Khách mời");

    private final String code;
    private final String description;

    ParticipantRole(String code, String description) {
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
