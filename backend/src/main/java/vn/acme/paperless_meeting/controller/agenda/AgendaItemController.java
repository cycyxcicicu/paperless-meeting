package vn.acme.paperless_meeting.controller.agenda;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.agenda.AgendaItemUpsertRequest;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.service.agenda.AgendaItemService;

@RestController
@RequestMapping
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AgendaItemController {

    AgendaItemService agendaItemService;

    @GetMapping("/meetings/{meetingId}/agenda-items")
    public ResponseEntity<ApiResponse<List<AgendaItemResponse>>> getAgendaItems(@PathVariable UUID meetingId) {
        List<AgendaItemResponse> response = agendaItemService.getAgendaItems(meetingId);
        return ResponseEntity.ok(ApiResponse.<List<AgendaItemResponse>>builder()
                .data(response)
                .build());
    }

    @PostMapping("/meetings/{meetingId}/agenda-items")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> createAgendaItem(
            @PathVariable UUID meetingId,
            @RequestBody @Valid AgendaItemUpsertRequest request) {
        AgendaItemResponse response = agendaItemService.createAgendaItem(meetingId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<AgendaItemResponse>builder()
                .data(response)
                .build());
    }

    @PutMapping("/meetings/{meetingId}/agenda-items/{id}")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> updateAgendaItem(
            @PathVariable UUID meetingId,
            @PathVariable UUID id,
            @RequestBody @Valid AgendaItemUpsertRequest request) {
        AgendaItemResponse response = agendaItemService.updateAgendaItem(meetingId, id, request);
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(response)
                .build());
    }

    @DeleteMapping("/meetings/{meetingId}/agenda-items/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAgendaItem(
            @PathVariable UUID meetingId,
            @PathVariable UUID id) {
        agendaItemService.deleteAgendaItem(meetingId, id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã xóa nội dung cuộc họp thành công")
                .build());
    }

    @PostMapping("/meetings/{meetingId}/agenda-items/{id}/send-prep-request")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> sendPrepRequest(
            @PathVariable UUID meetingId,
            @PathVariable UUID id) {
        AgendaItemResponse response = agendaItemService.sendPrepRequest(meetingId, id);
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(response)
                .message("Đã gửi yêu cầu chuẩn bị tài liệu thành công")
                .build());
    }

    @PostMapping("/agenda-items/{id}/submit-docs")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> submitDocs(
            @PathVariable UUID id,
            @RequestBody List<UUID> documentIds) {
        AgendaItemResponse response = agendaItemService.submitDocs(id, documentIds);
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(response)
                .message("Đã nộp tài liệu đính kèm thành công")
                .build());
    }

    @PostMapping("/agenda-items/{id}/approve")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> approveDocs(@PathVariable UUID id) {
        AgendaItemResponse response = agendaItemService.approveDocs(id);
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(response)
                .message("Đã phê duyệt tài liệu thành công")
                .build());
    }

    @PostMapping("/agenda-items/{id}/reject")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> rejectDocs(
            @PathVariable UUID id,
            @RequestParam String reason) {
        AgendaItemResponse response = agendaItemService.rejectDocs(id, reason);
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(response)
                .message("Đã từ chối tài liệu nội dung cuộc họp")
                .build());
    }

    @PostMapping("/meetings/{meetingId}/agenda-items/{id}/re-request")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> reRequest(
            @PathVariable UUID meetingId,
            @PathVariable UUID id) {
        AgendaItemResponse response = agendaItemService.reRequest(meetingId, id);
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(response)
                .message("Đã yêu cầu chuẩn bị lại tài liệu đầu mục")
                .build());
    }

    @GetMapping("/meetings/assigned-preparation")
    public ResponseEntity<ApiResponse<List<MeetingResponse>>> getAssignedPreparationMeetings() {
        List<MeetingResponse> response = agendaItemService.getAssignedPreparationMeetings();
        return ResponseEntity.ok(ApiResponse.<List<MeetingResponse>>builder()
                .data(response)
                .build());
    }
}
