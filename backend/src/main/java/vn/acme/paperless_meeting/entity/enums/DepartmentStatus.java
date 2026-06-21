package vn.acme.paperless_meeting.entity.enums;

public enum DepartmentStatus {
    ACTIVE("ACTIVE", "Hoạt động"),
    INACTIVE("INACTIVE", "Ngừng hoạt động"),
    MERGED("MERGED", "Đã sáp nhập"),
    CLOSED("CLOSED", "Đã kết thúc");

    private final String code;
    private final String description;

    DepartmentStatus(String code, String description) {
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
