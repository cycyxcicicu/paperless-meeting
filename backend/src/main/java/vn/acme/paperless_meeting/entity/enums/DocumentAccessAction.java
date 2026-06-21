package vn.acme.paperless_meeting.entity.enums;

public enum DocumentAccessAction {
    VIEW("VIEW", "Xem"),
    DOWNLOAD("DOWNLOAD", "Tải xuống"),
    PREVIEW("PREVIEW", "Xem trước");

    private final String code;
    private final String description;

    DocumentAccessAction(String code, String description) {
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
