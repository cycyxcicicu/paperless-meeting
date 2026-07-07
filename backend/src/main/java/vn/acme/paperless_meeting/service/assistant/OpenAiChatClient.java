package vn.acme.paperless_meeting.service.assistant;

import java.util.List;

import org.springframework.stereotype.Component;

import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.StructuredChatCompletionCreateParams;
import com.openai.models.moderations.ModerationCreateParams;
import com.openai.models.moderations.ModerationModel;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.dto.request.assistant.ChatHistoryMessage;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;

/**
 * Bọc OpenAI Java SDK: chat completion thường, structured output (JSON schema) và
 * Moderation API. Toàn bộ agent trong module assistant gọi qua lớp này để thống nhất
 * xử lý lỗi (map về AppException) và log.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAiChatClient {

    private final OpenAIClient client;

    public boolean isModerationFlagged(String text) {
        try {
            ModerationCreateParams params = ModerationCreateParams.builder()
                    .input(text)
                    .model(ModerationModel.OMNI_MODERATION_LATEST)
                    .build();
            return client.moderations().create(params).results().stream()
                    .anyMatch(result -> result.flagged());
        } catch (Exception e) {
            log.error("Gọi Moderation API thất bại: {}", e.getMessage(), e);
            // Lỗi gọi kiểm duyệt không được chặn luồng chính; system prompt của agent
            // vẫn có hàng rào chống lặp lại ngôn từ xúc phạm.
            return false;
        }
    }

    public String chat(String model, String systemPrompt, List<ChatHistoryMessage> history, String userQuestion) {
        ChatCompletionCreateParams.Builder builder = ChatCompletionCreateParams.builder()
                .model(model)
                .maxCompletionTokens(1024)
                .addSystemMessage(systemPrompt);

        if (history != null) {
            for (ChatHistoryMessage msg : history) {
                if ("assistant".equalsIgnoreCase(msg.getRole())) {
                    builder.addAssistantMessage(msg.getContent());
                } else {
                    builder.addUserMessage(msg.getContent());
                }
            }
        }
        builder.addUserMessage(userQuestion);

        try {
            ChatCompletion completion = client.chat().completions().create(builder.build());
            return completion.choices().stream()
                    .flatMap(choice -> choice.message().content().stream())
                    .findFirst()
                    .orElse("");
        } catch (Exception e) {
            log.error("Gọi OpenAI Chat Completions thất bại: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.ASSISTANT_PROVIDER_ERROR);
        }
    }

    public <T> T structuredChat(String model, String systemPrompt, String userQuestion, Class<T> responseType) {
        StructuredChatCompletionCreateParams<T> params = ChatCompletionCreateParams.builder()
                .model(model)
                .maxCompletionTokens(512)
                .responseFormat(responseType)
                .addSystemMessage(systemPrompt)
                .addUserMessage(userQuestion)
                .build();

        try {
            return client.chat().completions().create(params).choices().stream()
                    .flatMap(choice -> choice.message().content().stream())
                    .findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.ASSISTANT_PROVIDER_ERROR));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Gọi OpenAI Structured Output thất bại: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.ASSISTANT_PROVIDER_ERROR);
        }
    }
}
