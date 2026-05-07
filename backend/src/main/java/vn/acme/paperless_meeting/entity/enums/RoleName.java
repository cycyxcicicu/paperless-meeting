package vn.acme.paperless_meeting.entity.enums;

public enum RoleName {
    SUPER_ADMIN("ROLE_SUPER_ADMIN"),
    DEPARTMENT_ADMIN("ROLE_DEPARTMENT_ADMIN"),
    USER("ROLE_USER");

    private final String authority;

    RoleName(String authority) {
        this.authority = authority;
    }

    public String getAuthority() {
        return authority;
    }

}
