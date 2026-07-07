package vn.acme.paperless_meeting.controller.assistant;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.assistant.AssistantChatRequest;
import vn.acme.paperless_meeting.dto.response.assistant.AssistantChatResponse;
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
}
