package vn.acme.paperless_meeting.entity.enums;

public enum PositionCode {
    CHU_TICH("CHU_TICH", "Chủ tịch UBND", "Chủ tịch UBND"),
    PHO_CHU_TICH("PHO_CHU_TICH", "Phó Chủ tịch UBND", "Phó Chủ tịch UBND"),
    GIAM_DOC("GIAM_DOC", "Giám đốc / Chánh văn phòng", "Giám đốc / Chánh văn phòng"),
    PHO_GIAM_DOC("PHO_GIAM_DOC", "Phó Giám đốc / Phó chánh văn phòng", "Phó Giám đốc / Phó chánh văn phòng"),
    TRUONG_PHONG("TRUONG_PHONG", "Trưởng phòng", "Trưởng phòng"),
    PHO_TRUONG_PHONG("PHO_TRUONG_PHONG", "Phó Trưởng phòng", "Phó Trưởng phòng"),
    THU_KY("THU_KY", "Thư ký", "Thư ký"),
    CHUYEN_VIEN("CHUYEN_VIEN", "Chuyên viên", "Chuyên viên");

    private final String code;
    private final String name;
    private final String description;

    PositionCode(String code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
