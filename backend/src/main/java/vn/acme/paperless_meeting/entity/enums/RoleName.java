package vn.acme.paperless_meeting.entity.enums;

public enum RoleName {
    SUPER_ADMIN("ROLE_SUPER_ADMIN", "SUPER_ADMIN", "Quản trị viên tối cao"),
    DEPARTMENT_ADMIN("ROLE_DEPARTMENT_ADMIN", "DEPARTMENT_ADMIN", "Quản trị viên phòng ban"),
    USER("ROLE_USER", "USER", "Người dùng");

    private final String authority;
    private final String code;
    private final String description;

    RoleName(String authority, String code, String description) {
        this.authority = authority;
        this.code = code;
        this.description = description;
    }

    public String getAuthority() {
        return authority;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

}
