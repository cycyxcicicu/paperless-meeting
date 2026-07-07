package vn.acme.paperless_meeting.service.assistant;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.dto.request.assistant.AssistantChatRequest;
import vn.acme.paperless_meeting.dto.request.assistant.ChatHistoryMessage;
import vn.acme.paperless_meeting.dto.response.assistant.AssistantChatResponse;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.service.assistant.agent.AgentType;
import vn.acme.paperless_meeting.service.assistant.agent.SpecialistAgent;
import vn.acme.paperless_meeting.service.auth.CurrentUserService;

/**
 * Luồng chính của trợ lý AI diễn biến cuộc họp: kiểm tra quyền tham dự → giới hạn tần
 * suất → kiểm duyệt → điều phối phân loại → gọi song song agent chuyên trách → tổng
 * hợp (hoặc passthrough nếu chỉ 1 agent). Xem docs/ai-assistant-plan.md mục 2 và 5.
 */
@Service
@Slf4j
public class MeetingAssistantService {

    private static final String OFF_TOPIC_ANSWER =
            "Câu hỏi này nằm ngoài phạm vi hỗ trợ của trợ lý cuộc họp. Tôi chỉ có thể trả lời về thông tin của cuộc họp này.";
    private static final String OTHER_MEETING_ANSWER =
            "Tôi chỉ hỗ trợ thông tin của cuộc họp này, không thể trả lời về cuộc họp khác.";
    private static final String MODERATION_BLOCKED_ANSWER =
            "Vui lòng sử dụng ngôn từ lịch sự. Trợ lý không thể hỗ trợ nội dung này.";
    private static final String DEFAULT_CLARIFY_QUESTION = "Bạn có thể nói rõ hơn câu hỏi được không?";

    private final MeetingParticipantRepository meetingParticipantRepository;
    private final CurrentUserService currentUserService;
    private final AssistantRateLimiter rateLimiter;
    private final OpenAiChatClient openAiChatClient;
    private final OpenAiProperties openAiProperties;
    private final OrchestratorAgent orchestratorAgent;
    private final AnswerSynthesizer answerSynthesizer;
    private final Map<AgentType, SpecialistAgent> agentsByType;

    public MeetingAssistantService(MeetingParticipantRepository meetingParticipantRepository,
            CurrentUserService currentUserService,
            AssistantRateLimiter rateLimiter,
            OpenAiChatClient openAiChatClient,
            OpenAiProperties openAiProperties,
            OrchestratorAgent orchestratorAgent,
            AnswerSynthesizer answerSynthesizer,
            List<SpecialistAgent> specialistAgents) {
        this.meetingParticipantRepository = meetingParticipantRepository;
        this.currentUserService = currentUserService;
        this.rateLimiter = rateLimiter;
        this.openAiChatClient = openAiChatClient;
        this.openAiProperties = openAiProperties;
        this.orchestratorAgent = orchestratorAgent;
        this.answerSynthesizer = answerSynthesizer;
        this.agentsByType = new EnumMap<>(AgentType.class);
        for (SpecialistAgent agent : specialistAgents) {
            this.agentsByType.put(agent.type(), agent);
        }
    }

    public AssistantChatResponse chat(UUID meetingId, AssistantChatRequest request) {
        long start = System.currentTimeMillis();

        User caller = currentUserService.getCurrentActiveUser();
        if (!meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, caller.getId())) {
            throw new AppException(ErrorCode.ASSISTANT_NOT_A_PARTICIPANT);
        }

        String rateLimitKey = meetingId + ":" + caller.getId();
        int limit = openAiProperties.rateLimitPerMinute() != null ? openAiProperties.rateLimitPerMinute() : 10;
        if (!rateLimiter.tryAcquire(rateLimitKey, limit)) {
            throw new AppException(ErrorCode.ASSISTANT_RATE_LIMITED);
        }

        String question = request.getQuestion();
        List<ChatHistoryMessage> history = request.getHistory();

        if (openAiChatClient.isModerationFlagged(question)) {
            return buildResponse(MODERATION_BLOCKED_ANSWER, List.of(), true, start);
        }

        OrchestratorDecision decision = orchestratorAgent.classify(question, history);

        return switch (decision.intent) {
            case CLARIFY -> buildResponse(
                    decision.clarifyingQuestion != null && !decision.clarifyingQuestion.isBlank()
                            ? decision.clarifyingQuestion
                            : DEFAULT_CLARIFY_QUESTION,
                    List.of(), false, start);
            case OFF_TOPIC -> buildResponse(OFF_TOPIC_ANSWER, List.of(), true, start);
            case OTHER_MEETING -> buildResponse(OTHER_MEETING_ANSWER, List.of(), true, start);
            case ANSWER -> answerWithAgents(meetingId, question, history, decision.agents, start);
        };
    }

    private AssistantChatResponse answerWithAgents(UUID meetingId, String question, List<ChatHistoryMessage> history,
            List<AgentType> requestedAgents, long start) {
        List<AgentType> types = requestedAgents == null || requestedAgents.isEmpty()
                ? List.of(AgentType.MEETING_INFO)
                : requestedAgents;

        Map<AgentType, CompletableFuture<String>> futures = types.stream()
                .distinct()
                .filter(agentsByType::containsKey)
                .collect(Collectors.toMap(type -> type, type -> CompletableFuture.supplyAsync(() -> {
                    try {
                        return agentsByType.get(type).answer(meetingId, question, history);
                    } catch (Exception e) {
                        log.error("Agent {} gặp lỗi khi trả lời: {}", type, e.getMessage(), e);
                        return "Không thể lấy dữ liệu từ " + type.getLabel() + " lúc này.";
                    }
                })));

        Map<AgentType, String> answers = new EnumMap<>(AgentType.class);
        futures.forEach((type, future) -> answers.put(type, future.join()));

        String finalAnswer = answers.size() == 1
                ? answers.values().iterator().next()
                : answerSynthesizer.synthesize(question, answers);

        List<String> agentLabels = answers.keySet().stream().map(AgentType::getLabel).collect(Collectors.toList());
        return buildResponse(finalAnswer, agentLabels, false, start);
    }

    private AssistantChatResponse buildResponse(String answer, List<String> agentsUsed, boolean offTopic, long start) {
        return AssistantChatResponse.builder()
                .answer(answer)
                .agentsUsed(agentsUsed)
                .offTopic(offTopic)
                .tookMs(System.currentTimeMillis() - start)
                .build();
    }
}
