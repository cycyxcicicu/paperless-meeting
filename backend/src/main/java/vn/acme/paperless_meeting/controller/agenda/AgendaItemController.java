package vn.acme.paperless_meeting.controller.agenda;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
@Tag(name = "Agenda Item", description = "Quản lý nội dung nghị sự cuộc họp — tạo, phân công, chuẩn bị và phê duyệt tài liệu")
public class AgendaItemController {

    AgendaItemService agendaItemService;

    @Operation(summary = "Danh sách nội dung nghị sự của cuộc họp",
               description = "Trả về tất cả agenda items theo thứ tự orderNo, kèm trạng thái chuẩn bị tài liệu.")
    @GetMapping("/meetings/{meetingId}/agenda-items")
    public ResponseEntity<ApiResponse<List<AgendaItemResponse>>> getAgendaItems(@PathVariable UUID meetingId) {
        return ResponseEntity.ok(ApiResponse.<List<AgendaItemResponse>>builder()
                .data(agendaItemService.getAgendaItems(meetingId)).build());
    }

    @Operation(summary = "Tạo nội dung nghị sự mới",
               description = "Thêm một đầu mục vào cuộc họp. Cần chỉ định thứ tự, tiêu đề, thời gian và người chuẩn bị tài liệu. Thời gian phải nằm trong khung cuộc họp và không chồng chéo với đầu mục khác.")
    @PostMapping("/meetings/{meetingId}/agenda-items")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> createAgendaItem(
            @PathVariable UUID meetingId, @RequestBody @Valid AgendaItemUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.createAgendaItem(meetingId, request)).build());
    }

    @Operation(summary = "Cập nhật nội dung nghị sự",
               description = "Chỉnh sửa thông tin đầu mục. Chỉ cho phép khi agenda item chưa được phê duyệt.")
    @PutMapping("/meetings/{meetingId}/agenda-items/{id}")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> updateAgendaItem(
            @PathVariable UUID meetingId, @PathVariable UUID id,
            @RequestBody @Valid AgendaItemUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.updateAgendaItem(meetingId, id, request)).build());
    }

    @Operation(summary = "Xóa nội dung nghị sự",
               description = "Chỉ xóa được khi agenda item ở trạng thái DRAFT. Chỉ người tạo hoặc admin thực hiện được.")
    @DeleteMapping("/meetings/{meetingId}/agenda-items/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAgendaItem(
            @PathVariable UUID meetingId, @PathVariable UUID id) {
        agendaItemService.deleteAgendaItem(meetingId, id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Đã xóa nội dung cuộc họp thành công").build());
    }

    @Operation(summary = "Gửi yêu cầu chuẩn bị tài liệu",
               description = "Chuyển agenda item sang PENDING_PREPARATION và thông báo đến người được phân công chuẩn bị.")
    @PostMapping("/meetings/{meetingId}/agenda-items/{id}/send-prep-request")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> sendPrepRequest(
            @PathVariable UUID meetingId, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.sendPrepRequest(meetingId, id))
                .message("Đã gửi yêu cầu chuẩn bị tài liệu thành công").build());
    }

    @Operation(summary = "Nộp tài liệu đính kèm (người chuẩn bị)",
               description = "Người được phân công nộp danh sách ID tài liệu đã upload. Chuyển trạng thái sang PENDING_APPROVAL để chủ tọa xét duyệt.")
    @PostMapping("/agenda-items/{id}/submit-docs")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> submitDocs(
            @PathVariable UUID id, @RequestBody List<UUID> documentIds) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.submitDocs(id, documentIds))
                .message("Đã nộp tài liệu đính kèm thành công").build());
    }

    @Operation(summary = "Phê duyệt tài liệu (chủ tọa)",
               description = "Chủ tọa / người tạo cuộc họp đồng ý tài liệu. Chuyển sang APPROVED. Khi tất cả agenda items APPROVED mới được trình duyệt cuộc họp.")
    @PostMapping("/agenda-items/{id}/approve")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> approveDocs(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.approveDocs(id))
                .message("Đã phê duyệt tài liệu thành công").build());
    }

    @Operation(summary = "Từ chối tài liệu (chủ tọa)",
               description = "Chủ tọa từ chối tài liệu kèm lý do. Chuyển sang REJECTED — người chuẩn bị cần nộp lại.")
    @PostMapping("/agenda-items/{id}/reject")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> rejectDocs(
            @PathVariable UUID id, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.rejectDocs(id, reason))
                .message("Đã từ chối tài liệu nội dung cuộc họp").build());
    }

    @Operation(summary = "Yêu cầu chuẩn bị lại tài liệu",
               description = "Gửi lại yêu cầu chuẩn bị đến người phân công (khi đầu mục bị từ chối hoặc cần cập nhật).")
    @PostMapping("/meetings/{meetingId}/agenda-items/{id}/re-request")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> reRequest(
            @PathVariable UUID meetingId, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.reRequest(meetingId, id))
                .message("Đã yêu cầu chuẩn bị lại tài liệu đầu mục").build());
    }

    @Operation(summary = "Danh sách cuộc họp tôi được giao chuẩn bị tài liệu",
               description = "Trả về các cuộc họp mà user hiện tại được phân công làm người chuẩn bị tài liệu cho ít nhất một agenda item.")
    @GetMapping("/meetings/assigned-preparation")
    public ResponseEntity<ApiResponse<List<MeetingResponse>>> getAssignedPreparationMeetings() {
        return ResponseEntity.ok(ApiResponse.<List<MeetingResponse>>builder()
                .data(agendaItemService.getAssignedPreparationMeetings()).build());
    }

    @Operation(summary = "Bắt đầu điều hành nội dung cuộc họp",
               description = "Chuyển trạng thái nội dung cuộc họp sang IN_PROGRESS. Chỉ chủ tọa cuộc họp thực hiện được khi cuộc họp đang IN_PROGRESS.")
    @PostMapping("/meetings/{meetingId}/agenda-items/{id}/start")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> startAgenda(
            @PathVariable UUID meetingId, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.startAgenda(meetingId, id))
                .message("Đã bắt đầu điều hành nội dung cuộc họp thành công").build());
    }

    @Operation(summary = "Hoàn tất điều hành nội dung cuộc họp",
               description = "Chuyển trạng thái nội dung cuộc họp sang DONE. Chỉ chủ tọa cuộc họp thực hiện được khi cuộc họp đang IN_PROGRESS.")
    @PostMapping("/meetings/{meetingId}/agenda-items/{id}/complete")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> completeAgenda(
            @PathVariable UUID meetingId, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.completeAgenda(meetingId, id))
                .message("Đã hoàn tất điều hành nội dung cuộc họp thành công").build());
    }

    @Operation(summary = "Bỏ qua điều hành nội dung cuộc họp",
               description = "Chuyển trạng thái nội dung cuộc họp sang SKIPPED. Chỉ chủ tọa cuộc họp thực hiện được khi cuộc họp đang IN_PROGRESS.")
    @PostMapping("/meetings/{meetingId}/agenda-items/{id}/skip")
    public ResponseEntity<ApiResponse<AgendaItemResponse>> skipAgenda(
            @PathVariable UUID meetingId, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<AgendaItemResponse>builder()
                .data(agendaItemService.skipAgenda(meetingId, id))
                .message("Đã bỏ qua điều hành nội dung cuộc họp thành công").build());
    }
}
