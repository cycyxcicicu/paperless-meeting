package vn.acme.paperless_meeting.entity.enums;

public enum NotificationType {
    MEETING_INVITATION("MEETING_INVITATION", "Thư mời họp"),
    PREPARATION_REMINDER("PREPARATION_REMINDER", "Nhắc nhở chuẩn bị"),
    APPROVAL_REMINDER("APPROVAL_REMINDER", "Nhắc nhở phê duyệt"),
    SPEAKER_TURN_REMINDER("SPEAKER_TURN_REMINDER", "Nhắc nhở đến lượt phát biểu"),
    RSVP_ALERT("RSVP_ALERT", "Cảnh báo xác nhận tham dự"),
    GENERAL("GENERAL", "Thông báo chung"),
    MEETING_POSTPONED("MEETING_POSTPONED", "Cuộc họp bị hoãn"),
    MEETING_CANCELLED("MEETING_CANCELLED", "Cuộc họp bị hủy");

    private final String code;
    private final String description;

    NotificationType(String code, String description) {
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
