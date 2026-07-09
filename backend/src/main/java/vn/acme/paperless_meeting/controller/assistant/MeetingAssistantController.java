package vn.acme.paperless_meeting.controller.assistant;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.assistant.AssistantChatRequest;
import vn.acme.paperless_meeting.dto.response.assistant.AssistantChatResponse;
import vn.acme.paperless_meeting.dto.response.assistant.AssistantHistoryPageResponse;
import vn.acme.paperless_meeting.service.assistant.MeetingAssistantService;

@RestController
@RequestMapping("/meetings/{meetingId}/assistant")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "MeetingAssistant", description = "Trợ lý AI diễn biến cuộc họp - hỏi đáp về thông tin, tài liệu, biểu quyết, biên bản của cuộc họp")
public class MeetingAssistantController {

    MeetingAssistantService meetingAssistantService;

    @Operation(summary = "Hỏi trợ lý AI về cuộc họp",
               description = "Chỉ người tham dự (MeetingParticipant) của cuộc họp mới được hỏi. Câu hỏi chỉ được trả lời trong phạm vi dữ liệu của cuộc họp này.")
    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<AssistantChatResponse>> chat(
            @PathVariable UUID meetingId,
            @RequestBody @Valid AssistantChatRequest request) {
        return ResponseEntity.ok(ApiResponse.<AssistantChatResponse>builder()
                .success(true)
                .data(meetingAssistantService.chat(meetingId, request))
                .build());
    }

    @Operation(summary = "Hỏi trợ lý AI về cuộc họp - streaming (trả lời dần theo thời gian thực qua SSE)",
               description = "Cùng logic quyền/kiểm duyệt/điều phối như /chat, nhưng phát từng đoạn chữ của câu trả lời "
                       + "ngay khi model sinh ra (sự kiện 'delta'), kết thúc bằng sự kiện 'done' kèm agentsUsed/offTopic/tookMs, "
                       + "hoặc 'error' nếu có lỗi. Đóng kết nối từ phía client (huỷ request) để dừng sinh câu trả lời giữa chừng - "
                       + "phần đã sinh được vẫn được lưu lại lịch sử.")
    @PostMapping(path = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public SseEmitter chatStream(@PathVariable UUID meetingId, @RequestBody @Valid AssistantChatRequest request) {
        SseEmitter emitter = new SseEmitter(0L);
        AtomicBoolean cancelled = new AtomicBoolean(false);
        emitter.onError(e -> cancelled.set(true));
        emitter.onTimeout(() -> cancelled.set(true));
        emitter.onCompletion(() -> cancelled.set(true));

        // @PreAuthorize/CurrentUserService đọc SecurityContextHolder theo ThreadLocal của
        // thread xử lý request gốc; việc sinh câu trả lời chạy ở thread khác (bất đồng bộ,
        // để trả SseEmitter về ngay) nên phải copy thủ công sang thread đó.
        SecurityContext securityContext = SecurityContextHolder.getContext();
        CompletableFuture.runAsync(() -> {
            SecurityContextHolder.setContext(securityContext);
            try {
                meetingAssistantService.chatStream(meetingId, request, emitter, cancelled);
            } finally {
                SecurityContextHolder.clearContext();
            }
        });

        return emitter;
    }

    @Operation(summary = "Lấy lịch sử chat với trợ lý AI của người dùng hiện tại cho cuộc họp này (phân trang 20/lần)",
               description = "Chỉ trả về lịch sử của chính người gọi API. Không truyền 'before' để lấy 20 tin mới nhất; "
                       + "truyền 'before' = thời điểm tin cũ nhất đã có để tải thêm các tin cũ hơn (phân trang theo "
                       + "cursor, không theo số trang, nên không bị lệch dữ liệu khi có tin nhắn mới phát sinh trong lúc cuộn).")
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<AssistantHistoryPageResponse>> getHistory(
            @PathVariable UUID meetingId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before) {
        return ResponseEntity.ok(ApiResponse.<AssistantHistoryPageResponse>builder()
                .success(true)
                .data(meetingAssistantService.getHistory(meetingId, before))
                .build());
    }
}
