package vn.acme.paperless_meeting.service.assistant.agent;

import java.util.List;
import java.util.UUID;

import vn.acme.paperless_meeting.dto.request.assistant.ChatHistoryMessage;

public interface SpecialistAgent {
    AgentType type();

    String answer(UUID meetingId, String question, List<ChatHistoryMessage> history);
}
