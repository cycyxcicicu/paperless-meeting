package vn.acme.paperless_meeting.dto.response.assistant;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AssistantHistoryPageResponse {
    private List<AssistantMessageResponse> messages;
    private boolean hasMore;
    private LocalDateTime nextCursor;
}
