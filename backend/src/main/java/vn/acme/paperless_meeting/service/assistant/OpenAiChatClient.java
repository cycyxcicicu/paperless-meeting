package vn.acme.paperless_meeting.service.assistant;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

import org.springframework.stereotype.Component;

import com.openai.client.OpenAIClient;
import com.openai.core.http.StreamResponse;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionChunk;
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
        ChatCompletionCreateParams params = buildParams(model, systemPrompt, history, userQuestion).build();

        try {
            ChatCompletion completion = client.chat().completions().create(params);
            return completion.choices().stream()
                    .flatMap(choice -> choice.message().content().stream())
                    .findFirst()
                    .orElse("");
        } catch (Exception e) {
            log.error("Gọi OpenAI Chat Completions thất bại: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.ASSISTANT_PROVIDER_ERROR);
        }
    }

    /**
     * Giống {@link #chat}, nhưng phát từng đoạn chữ (delta) qua onDelta ngay khi model
     * sinh ra, để giao diện hiện hiệu ứng trả lời từ từ. Trả về toàn bộ câu trả lời đã
     * ghép (kể cả khi bị hủy giữa chừng, vẫn trả phần đã sinh được để lưu lại lịch sử).
     * cancelled được kiểm tra sau mỗi đoạn - true thì đóng stream sớm (client đã bấm Dừng
     * hoặc mất kết nối), không tốn thêm token sinh tiếp.
     */
    public String chatStream(String model, String systemPrompt, List<ChatHistoryMessage> history,
            String userQuestion, Consumer<String> onDelta, AtomicBoolean cancelled) {
        ChatCompletionCreateParams params = buildParams(model, systemPrompt, history, userQuestion).build();
        StringBuilder full = new StringBuilder();

        try (StreamResponse<ChatCompletionChunk> streamResponse = client.chat().completions().createStreaming(params)) {
            streamResponse.stream()
                    .flatMap(chunk -> chunk.choices().stream())
                    .flatMap(choice -> choice.delta().content().stream())
                    .forEach(delta -> {
                        if (cancelled.get()) {
                            streamResponse.close();
                            return;
                        }
                        full.append(delta);
                        onDelta.accept(delta);
                    });
        } catch (Exception e) {
            if (!cancelled.get()) {
                log.error("Gọi OpenAI Chat Completions (streaming) thất bại: {}", e.getMessage(), e);
            }
        }

        return full.toString();
    }

    private ChatCompletionCreateParams.Builder buildParams(String model, String systemPrompt,
            List<ChatHistoryMessage> history, String userQuestion) {
        ChatCompletionCreateParams.Builder builder = ChatCompletionCreateParams.builder()
                .model(model)
                .maxCompletionTokens(1024)
                .addSystemMessage(systemPrompt);

        if (history != null) {
            for (ChatHistoryMessage msg : history) {
                // Bỏ qua tin lịch sử rỗng (vd: lượt trước bị dừng/lỗi trước khi có chữ nào) -
                // OpenAI API cũng từ chối message content rỗng, nên phải lọc ở đây thay vì để
                // cả request thất bại.
                if (msg.getContent() == null || msg.getContent().isBlank()) {
                    continue;
                }
                if ("assistant".equalsIgnoreCase(msg.getRole())) {
                    builder.addAssistantMessage(msg.getContent());
                } else {
                    builder.addUserMessage(msg.getContent());
                }
            }
        }
        builder.addUserMessage(userQuestion);
        return builder;
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
