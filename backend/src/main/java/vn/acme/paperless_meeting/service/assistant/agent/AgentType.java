package vn.acme.paperless_meeting.service.assistant.agent;

public enum AgentType {
    MEETING_INFO("Agent Thông tin họp"),
    DOCUMENT("Agent Tài liệu"),
    VOTING("Agent Biểu quyết"),
    MINUTES_OPINION("Agent Biên bản - Ý kiến");

    private final String label;

    AgentType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
