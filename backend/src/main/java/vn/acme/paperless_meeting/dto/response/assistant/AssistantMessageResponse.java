package vn.acme.paperless_meeting.dto.response.assistant;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AssistantMessageResponse {
    private String role;
    private String content;
    private List<String> agentsUsed;
    private boolean offTopic;
    private LocalDateTime createdAt;
}
