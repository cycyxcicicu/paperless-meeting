package vn.acme.paperless_meeting.entity.enums;

public enum PermissionName {
    // User-related
    PROFILE_UPDATE_SELF("PROFILE_UPDATE_SELF", "Cập nhật thông tin cá nhân"),
    USER_VIEW_DEPARTMENT("USER_VIEW_DEPARTMENT", "Xem thông tin người dùng phòng ban"),
    USER_MANAGE_DEPARTMENT("USER_MANAGE_DEPARTMENT", "Quản lý người dùng phòng ban"),
    USER_VIEW_ALL("USER_VIEW_ALL", "Xem thông tin tất cả người dùng"),
    USER_MANAGE_ALL("USER_MANAGE_ALL", "Quản lý tất cả người dùng"),

    // Meeting-related
    MEETING_CREATE("MEETING_CREATE", "Tạo cuộc họp"),
    MEETING_VIEW_OWN("MEETING_VIEW_OWN", "Xem cuộc họp cá nhân"),
    MEETING_MANAGE_OWN("MEETING_MANAGE_OWN", "Quản lý cuộc họp cá nhân"),
    MEETING_VIEW_DEPARTMENT("MEETING_VIEW_DEPARTMENT", "Xem cuộc họp phòng ban"),
    MEETING_MANAGE_DEPARTMENT("MEETING_MANAGE_DEPARTMENT", "Quản lý cuộc họp phòng ban"),
    MEETING_VIEW_ALL("MEETING_VIEW_ALL", "Xem tất cả cuộc họp"),
    MEETING_MANAGE_ALL("MEETING_MANAGE_ALL", "Quản lý tất cả cuộc họp"),

    // Location
    LOCATION_VIEW_DEPARTMENT("LOCATION_VIEW_DEPARTMENT", "Xem địa điểm phòng ban"),
    LOCATION_MANAGE_DEPARTMENT("LOCATION_MANAGE_DEPARTMENT", "Quản lý địa điểm phòng ban"),
    LOCATION_VIEW_ALL("LOCATION_VIEW_ALL", "Xem tất cả địa điểm"),
    LOCATION_MANAGE_ALL("LOCATION_MANAGE_ALL", "Quản lý tất cả địa điểm"),

    // Report
    REPORT_VIEW_DEPARTMENT("REPORT_VIEW_DEPARTMENT", "Xem báo cáo phòng ban"),
    REPORT_VIEW_ALL("REPORT_VIEW_ALL", "Xem tất cả báo cáo"),

    // Backwards-compat / legacy permissions
    MEETING_VIEW("MEETING_VIEW", "Xem cuộc họp"),
    MEETING_UPDATE("MEETING_UPDATE", "Cập nhật cuộc họp"),
    MEETING_CANCEL("MEETING_CANCEL", "Hủy cuộc họp"),
    PARTICIPANT_MANAGE("PARTICIPANT_MANAGE", "Quản lý người tham gia"),
    AGENDA_MANAGE("AGENDA_MANAGE", "Quản lý nội dung cuộc họp"),

    // RBAC maintenance
    MANAGE_ROLE_ASSIGNMENTS("MANAGE_ROLE_ASSIGNMENTS", "Quản lý phân quyền vai trò"),
    VIEW_ROLE_ASSIGNMENTS("VIEW_ROLE_ASSIGNMENTS", "Xem phân quyền vai trò");

    private final String code;
    private final String description;

    PermissionName(String code, String description) {
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
