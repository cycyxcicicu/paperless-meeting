package vn.acme.paperless_meeting.dto.response.assistant;

import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AssistantChatResponse {
    private String answer;
    private List<String> agentsUsed;
    private boolean offTopic;
    private long tookMs;
}
