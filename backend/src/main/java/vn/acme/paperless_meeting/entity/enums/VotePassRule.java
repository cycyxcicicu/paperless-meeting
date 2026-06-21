package vn.acme.paperless_meeting.entity.enums;

public enum VotePassRule {
    SIMPLE_MAJORITY("SIMPLE_MAJORITY", "Đa số phiếu thuận (quá bán)"),
    TWO_THIRDS("TWO_THIRDS", "Hai phần ba số phiếu thuận"),
    CUSTOM("CUSTOM", "Quy tắc tùy chỉnh");

    private final String code;
    private final String description;

    VotePassRule(String code, String description) {
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
