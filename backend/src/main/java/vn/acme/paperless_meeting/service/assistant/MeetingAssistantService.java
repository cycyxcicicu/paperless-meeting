package vn.acme.paperless_meeting.service.assistant;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.dto.request.assistant.AssistantChatRequest;
import vn.acme.paperless_meeting.dto.request.assistant.ChatHistoryMessage;
import vn.acme.paperless_meeting.dto.response.assistant.AssistantChatResponse;
import vn.acme.paperless_meeting.dto.response.assistant.AssistantHistoryPageResponse;
import vn.acme.paperless_meeting.dto.response.assistant.AssistantMessageResponse;
import vn.acme.paperless_meeting.entity.AssistantMessage;
import vn.acme.paperless_meeting.entity.Meeting;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.AssistantMessageRole;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.AssistantMessageRepository;
import vn.acme.paperless_meeting.repository.MeetingParticipantRepository;
import vn.acme.paperless_meeting.repository.MeetingRepository;
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
    private static final String GREETING_ANSWER =
            "Xin chào! Tôi là trợ lý AI hỗ trợ thông tin cho cuộc họp này. Bạn có thể hỏi tôi về thành phần tham "
                    + "dự, chương trình họp, tài liệu đính kèm, biểu quyết, ý kiến đóng góp... Bạn cần biết gì?";
    private static final String MODERATION_BLOCKED_ANSWER =
            "Vui lòng sử dụng ngôn từ lịch sự. Trợ lý không thể hỗ trợ nội dung này.";
    private static final String DEFAULT_CLARIFY_QUESTION = "Bạn có thể nói rõ hơn câu hỏi được không?";
    private static final int HISTORY_PAGE_SIZE = 20;

    private final MeetingParticipantRepository meetingParticipantRepository;
    private final MeetingRepository meetingRepository;
    private final AssistantMessageRepository assistantMessageRepository;
    private final CurrentUserService currentUserService;
    private final AssistantRateLimiter rateLimiter;
    private final OpenAiChatClient openAiChatClient;
    private final OpenAiProperties openAiProperties;
    private final OrchestratorAgent orchestratorAgent;
    private final AnswerSynthesizer answerSynthesizer;
    private final Map<AgentType, SpecialistAgent> agentsByType;

    public MeetingAssistantService(MeetingParticipantRepository meetingParticipantRepository,
            MeetingRepository meetingRepository,
            AssistantMessageRepository assistantMessageRepository,
            CurrentUserService currentUserService,
            AssistantRateLimiter rateLimiter,
            OpenAiChatClient openAiChatClient,
            OpenAiProperties openAiProperties,
            OrchestratorAgent orchestratorAgent,
            AnswerSynthesizer answerSynthesizer,
            List<SpecialistAgent> specialistAgents) {
        this.meetingParticipantRepository = meetingParticipantRepository;
        this.meetingRepository = meetingRepository;
        this.assistantMessageRepository = assistantMessageRepository;
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

        AssistantChatResponse response;
        if (openAiChatClient.isModerationFlagged(question)) {
            response = buildResponse(MODERATION_BLOCKED_ANSWER, List.of(), true, start);
        } else {
            OrchestratorDecision decision = orchestratorAgent.classify(question, history);

            response = switch (decision.intent) {
                case CLARIFY -> buildResponse(
                        decision.clarifyingQuestion != null && !decision.clarifyingQuestion.isBlank()
                                ? decision.clarifyingQuestion
                                : DEFAULT_CLARIFY_QUESTION,
                        List.of(), false, start);
                case OFF_TOPIC -> buildResponse(OFF_TOPIC_ANSWER, List.of(), true, start);
                case OTHER_MEETING -> buildResponse(OTHER_MEETING_ANSWER, List.of(), true, start);
                case GREETING -> buildResponse(GREETING_ANSWER, List.of(), false, start);
                case ANSWER -> answerWithAgents(meetingId, caller.getId(), question, history, decision.agents, start);
            };
        }

        saveTurn(meetingId, caller, question, response);
        return response;
    }

    /**
     * Bản streaming của {@link #chat}: phát từng đoạn chữ qua SseEmitter ngay khi model
     * sinh ra thay vì đợi xong mới trả 1 lần. Chỉ nhánh trả lời cuối cùng mà người dùng
     * thực sự nhìn thấy mới streaming (1 agent duy nhất, hoặc bước tổng hợp khi ≥2 agent) -
     * Moderation và Điều phối vẫn phải chờ xong (không streaming được vì cần JSON đầy đủ).
     * Nếu người dùng bấm Dừng giữa chừng (cancelled=true), vẫn lưu lại phần đã sinh được,
     * giống hành vi của ChatGPT.
     */
    public void chatStream(UUID meetingId, AssistantChatRequest request, SseEmitter emitter, AtomicBoolean cancelled) {
        long start = System.currentTimeMillis();
        User caller;
        try {
            caller = currentUserService.getCurrentActiveUser();
            if (!meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, caller.getId())) {
                throw new AppException(ErrorCode.ASSISTANT_NOT_A_PARTICIPANT);
            }
            String rateLimitKey = meetingId + ":" + caller.getId();
            int limit = openAiProperties.rateLimitPerMinute() != null ? openAiProperties.rateLimitPerMinute() : 10;
            if (!rateLimiter.tryAcquire(rateLimitKey, limit)) {
                throw new AppException(ErrorCode.ASSISTANT_RATE_LIMITED);
            }
        } catch (AppException e) {
            emitError(emitter, e.getMessage());
            emitter.complete();
            return;
        }

        String question = request.getQuestion();
        List<ChatHistoryMessage> history = request.getHistory();
        String finalAnswer;
        List<String> agentsUsed = List.of();
        boolean offTopic = false;

        try {
            if (cancelled.get()) {
                finalAnswer = "";
            } else if (openAiChatClient.isModerationFlagged(question)) {
                finalAnswer = MODERATION_BLOCKED_ANSWER;
                offTopic = true;
                emitDelta(emitter, finalAnswer);
            } else {
                OrchestratorDecision decision = orchestratorAgent.classify(question, history);

                if (cancelled.get()) {
                    finalAnswer = "";
                } else if (decision.intent == OrchestratorDecision.Intent.CLARIFY) {
                    finalAnswer = decision.clarifyingQuestion != null && !decision.clarifyingQuestion.isBlank()
                            ? decision.clarifyingQuestion
                            : DEFAULT_CLARIFY_QUESTION;
                    emitDelta(emitter, finalAnswer);
                } else if (decision.intent == OrchestratorDecision.Intent.OFF_TOPIC) {
                    finalAnswer = OFF_TOPIC_ANSWER;
                    offTopic = true;
                    emitDelta(emitter, finalAnswer);
                } else if (decision.intent == OrchestratorDecision.Intent.OTHER_MEETING) {
                    finalAnswer = OTHER_MEETING_ANSWER;
                    offTopic = true;
                    emitDelta(emitter, finalAnswer);
                } else if (decision.intent == OrchestratorDecision.Intent.GREETING) {
                    finalAnswer = GREETING_ANSWER;
                    emitDelta(emitter, finalAnswer);
                } else {
                    List<AgentType> types = resolveAgentTypes(decision.agents);
                    if (types.size() == 1) {
                        AgentType only = types.get(0);
                        agentsUsed = List.of(only.getLabel());
                        finalAnswer = agentsByType.get(only).answerStream(meetingId, caller.getId(), question, history,
                                delta -> emitDelta(emitter, delta), cancelled);
                    } else {
                        Map<AgentType, String> answers = resolveAgentsBlocking(meetingId, caller.getId(), question, history, types);
                        agentsUsed = answers.keySet().stream().map(AgentType::getLabel).collect(Collectors.toList());
                        finalAnswer = answerSynthesizer.synthesizeStream(question, answers,
                                delta -> emitDelta(emitter, delta), cancelled);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi xử lý streaming chat: {}", e.getMessage(), e);
            emitError(emitter, "Trợ lý AI đang gặp sự cố, vui lòng thử lại sau.");
            emitter.completeWithError(e);
            return;
        }

        long tookMs = System.currentTimeMillis() - start;
        if (!finalAnswer.isBlank()) {
            saveTurn(meetingId, caller, question, buildResponse(finalAnswer, agentsUsed, offTopic, start));
        }
        emitDone(emitter, agentsUsed, offTopic, tookMs);
        emitter.complete();
    }

    private void emitDelta(SseEmitter emitter, String delta) {
        try {
            // Bọc trong Map thay vì gửi String trần: Jackson chỉ JSON-hoá String trần
            // thành "chuỗi có escape" khi payload là Map/object, còn String trần bị
            // StringHttpMessageConverter ghi thẳng ra không escape - vỡ khung SSE nếu
            // câu trả lời có xuống dòng (vd: danh sách nhiều dòng).
            emitter.send(SseEmitter.event().name("delta").data(Map.of("text", delta), MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            // Client đã ngắt kết nối (bấm Dừng hoặc mất mạng) - bỏ qua, cờ cancelled đã
            // được set qua onError/onCompletion của emitter ở tầng controller.
        }
    }

    private void emitDone(SseEmitter emitter, List<String> agentsUsed, boolean offTopic, long tookMs) {
        try {
            emitter.send(SseEmitter.event().name("done").data(
                    Map.of("agentsUsed", agentsUsed, "offTopic", offTopic, "tookMs", tookMs),
                    MediaType.APPLICATION_JSON));
        } catch (IOException ignored) {
        }
    }

    private void emitError(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event().name("error").data(Map.of("message", message), MediaType.APPLICATION_JSON));
        } catch (IOException ignored) {
        }
    }

    /**
     * Phân trang lịch sử chat theo cursor (before), KHÔNG theo số trang: gọi lần đầu
     * không truyền before (lấy 20 tin mới nhất), các lần sau truyền before = thời điểm
     * tin cũ nhất đã có ở client. Cách này không bao giờ bị lệch/trùng dữ liệu dù người
     * dùng vẫn đang tiếp tục chat (tin mới liên tục được lưu thêm ở phía sau) trong lúc
     * cuộn lên xem lịch sử cũ, vì mốc neo là thời điểm, không phải số thứ tự trang.
     */
    @Transactional(readOnly = true)
    public AssistantHistoryPageResponse getHistory(UUID meetingId, LocalDateTime before) {
        User caller = currentUserService.getCurrentActiveUser();
        if (!meetingParticipantRepository.existsByMeetingIdAndUserId(meetingId, caller.getId())) {
            throw new AppException(ErrorCode.ASSISTANT_NOT_A_PARTICIPANT);
        }

        List<AssistantMessage> rows = assistantMessageRepository.findPageBeforeCursor(
                meetingId, caller.getId(), before, PageRequest.of(0, HISTORY_PAGE_SIZE + 1));

        boolean hasMore = rows.size() > HISTORY_PAGE_SIZE;
        List<AssistantMessage> page = new ArrayList<>(hasMore ? rows.subList(0, HISTORY_PAGE_SIZE) : rows);
        // rows đến đây đang xếp mới nhất -> cũ nhất (DESC); đảo lại thành cũ nhất -> mới nhất để hiển thị
        Collections.reverse(page);

        return AssistantHistoryPageResponse.builder()
                .messages(page.stream().map(this::mapToMessageResponse).collect(Collectors.toList()))
                .hasMore(hasMore)
                .nextCursor(hasMore ? page.get(0).getCreatedAt() : null)
                .build();
    }

    private void saveTurn(UUID meetingId, User caller, String question, AssistantChatResponse response) {
        Meeting meetingRef = meetingRepository.getReferenceById(meetingId);
        LocalDateTime userTurnTime = LocalDateTime.now();

        AssistantMessage userMessage = AssistantMessage.builder()
                .meeting(meetingRef)
                .user(caller)
                .role(AssistantMessageRole.USER)
                .content(question)
                .createdAt(userTurnTime)
                .build();

        AssistantMessage assistantMessage = AssistantMessage.builder()
                .meeting(meetingRef)
                .user(caller)
                .role(AssistantMessageRole.ASSISTANT)
                .content(response.getAnswer())
                .agentsUsed(response.getAgentsUsed() == null || response.getAgentsUsed().isEmpty()
                        ? null
                        : String.join(",", response.getAgentsUsed()))
                .offTopic(response.isOffTopic())
                // +1ms để đảm bảo thứ tự tuyệt đối so với userMessage, tránh 2 mốc giờ trùng
                // nhau làm sai lệch cursor phân trang.
                .createdAt(userTurnTime.plusNanos(1_000_000))
                .build();

        assistantMessageRepository.saveAll(List.of(userMessage, assistantMessage));
    }

    private AssistantMessageResponse mapToMessageResponse(AssistantMessage message) {
        return AssistantMessageResponse.builder()
                .role(message.getRole() == AssistantMessageRole.USER ? "user" : "assistant")
                .content(message.getContent())
                .agentsUsed(message.getAgentsUsed() == null || message.getAgentsUsed().isBlank()
                        ? Collections.emptyList()
                        : Arrays.asList(message.getAgentsUsed().split(",")))
                .offTopic(Boolean.TRUE.equals(message.getOffTopic()))
                .createdAt(message.getCreatedAt())
                .build();
    }

    private AssistantChatResponse answerWithAgents(UUID meetingId, UUID callerId, String question,
            List<ChatHistoryMessage> history, List<AgentType> requestedAgents, long start) {
        List<AgentType> types = resolveAgentTypes(requestedAgents);
        Map<AgentType, String> answers = resolveAgentsBlocking(meetingId, callerId, question, history, types);

        String finalAnswer = answers.size() == 1
                ? answers.values().iterator().next()
                : answerSynthesizer.synthesize(question, answers);

        List<String> agentLabels = answers.keySet().stream().map(AgentType::getLabel).collect(Collectors.toList());
        return buildResponse(finalAnswer, agentLabels, false, start);
    }

    private List<AgentType> resolveAgentTypes(List<AgentType> requestedAgents) {
        List<AgentType> types = requestedAgents == null || requestedAgents.isEmpty()
                ? List.of(AgentType.MEETING_INFO)
                : requestedAgents;
        return types.stream().distinct().filter(agentsByType::containsKey).collect(Collectors.toList());
    }

    private Map<AgentType, String> resolveAgentsBlocking(UUID meetingId, UUID callerId, String question,
            List<ChatHistoryMessage> history, List<AgentType> types) {
        Map<AgentType, CompletableFuture<String>> futures = types.stream()
                .collect(Collectors.toMap(type -> type, type -> CompletableFuture.supplyAsync(() -> {
                    try {
                        return agentsByType.get(type).answer(meetingId, callerId, question, history);
                    } catch (Exception e) {
                        log.error("Agent {} gặp lỗi khi trả lời: {}", type, e.getMessage(), e);
                        return "Không thể lấy dữ liệu từ " + type.getLabel() + " lúc này.";
                    }
                })));

        Map<AgentType, String> answers = new EnumMap<>(AgentType.class);
        futures.forEach((type, future) -> answers.put(type, future.join()));
        return answers;
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
