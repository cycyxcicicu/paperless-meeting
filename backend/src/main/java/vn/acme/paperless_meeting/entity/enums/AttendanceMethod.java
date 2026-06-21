package vn.acme.paperless_meeting.entity.enums;

public enum AttendanceMethod {
    QR("QR", "Quét mã QR"),
    MANUAL("MANUAL", "Thủ công"),
    GPS("GPS", "Định vị GPS"),
    NFC("NFC", "Kết nối NFC");

    private final String code;
    private final String description;

    AttendanceMethod(String code, String description) {
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
