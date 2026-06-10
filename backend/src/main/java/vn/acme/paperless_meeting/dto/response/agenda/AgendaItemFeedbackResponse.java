package vn.acme.paperless_meeting.dto.response.agenda;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgendaItemFeedbackResponse {
    private UUID id;
    private String authorName;
    private String content;
    private String type; // INSTRUCTION, REJECTION
    private LocalDateTime createdAt;
}
