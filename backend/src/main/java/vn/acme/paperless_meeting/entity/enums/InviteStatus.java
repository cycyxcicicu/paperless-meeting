package vn.acme.paperless_meeting.entity.enums;

public enum InviteStatus {
    PENDING("PENDING", "Chờ phê duyệt"),
    ACCEPTED("ACCEPTED", "Đã đồng ý"),
    DECLINED("DECLINED", "Từ chối");

    private final String code;
    private final String description;

    InviteStatus(String code, String description) {
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
