package vn.acme.paperless_meeting.entity.enums;

public enum VoteType {
    YES_NO("YES_NO", "Có / Không"),
    YES_NO_ABSTAIN("YES_NO_ABSTAIN", "Đồng ý / Không đồng ý / Ý kiến khác"),
    MULTIPLE_CHOICE("MULTIPLE_CHOICE", "Nhiều lựa chọn");

    private final String code;
    private final String description;

    VoteType(String code, String description) {
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
