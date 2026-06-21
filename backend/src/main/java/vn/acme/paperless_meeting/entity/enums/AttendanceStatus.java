package vn.acme.paperless_meeting.entity.enums;

public enum AttendanceStatus {
    NOT_CHECKED_IN("NOT_CHECKED_IN", "Chưa điểm danh"),
    PRESENT("PRESENT", "Có mặt"),
    ABSENT("ABSENT", "Vắng mặt");

    private final String code;
    private final String description;

    AttendanceStatus(String code, String description) {
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
