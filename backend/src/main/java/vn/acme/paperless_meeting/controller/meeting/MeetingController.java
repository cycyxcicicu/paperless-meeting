package vn.acme.paperless_meeting.controller.meeting;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
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
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingUpsertRequest;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingInvitationUpdateRequest;
import vn.acme.paperless_meeting.dto.request.meeting.MeetingInvitationPreviewRequest;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingInvitationPreviewResponse;
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;
import vn.acme.paperless_meeting.service.meeting.MeetingService;

@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Meeting", description = "Quản lý cuộc họp — tạo, cập nhật, duyệt, công bố và kết thúc")
public class MeetingController {

    MeetingService meetingService;

    @Operation(summary = "Danh sách cuộc họp (có phân trang, lọc)",
               description = "Lọc theo từ khóa tiêu đề, trạng thái (DRAFT/PENDING_APPROVAL/...) và khoảng thời gian. Hỗ trợ phân trang qua ?page=&size=&sort=.")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MeetingResponse>>> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<MeetingStatus> statuses,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<MeetingResponse> response = meetingService.findAll(keyword, statuses, fromDate, toDate, pageable);
        return ResponseEntity.ok(ApiResponse.<PageResponse<MeetingResponse>>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Danh sách cuộc họp cho Lịch họp (không phân trang)",
               description = "Lấy danh sách các cuộc họp thuộc khoảng thời gian fromDate - toDate, lọc theo danh sách trạng thái và lọc chỉ các cuộc họp mình tham gia.")
    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<MeetingResponse>>> findCalendarMeetings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) List<MeetingStatus> statuses,
            @RequestParam(required = false) Boolean onlyMyMeetings) {

        List<MeetingResponse> response = meetingService.findCalendarMeetings(fromDate, toDate, statuses, onlyMyMeetings);
        return ResponseEntity.ok(ApiResponse.<List<MeetingResponse>>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Chi tiết cuộc họp theo ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingResponse>> findById(@PathVariable UUID id) {
        MeetingResponse response = meetingService.findById(id);
        return ResponseEntity.ok(ApiResponse.<MeetingResponse>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Tạo cuộc họp mới",
               description = "Tạo cuộc họp ở trạng thái DRAFT. Người tạo tự động trở thành chủ tọa. Cần điền đầy đủ tiêu đề, địa điểm, thời gian bắt đầu/kết thúc.")
    @PostMapping
    public ResponseEntity<ApiResponse<MeetingResponse>> create(@RequestBody @Valid MeetingUpsertRequest request) {
        MeetingResponse response = meetingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<MeetingResponse>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Cập nhật thông tin cuộc họp",
               description = "Chỉ cho phép khi cuộc họp đang ở trạng thái DRAFT hoặc REJECTED. Chỉ người tạo hoặc admin mới được sửa.")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingResponse>> update(@PathVariable UUID id, @RequestBody @Valid MeetingUpsertRequest request) {
        MeetingResponse response = meetingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<MeetingResponse>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Cập nhật mẫu thư mời của cuộc họp",
               description = "Chỉ cập nhật 3 trường: yêu cầu giấy mời, mẫu thư mời và nội dung thư mời.")
    @PutMapping("/{id}/invitation")
    public ResponseEntity<ApiResponse<Void>> updateInvitation(
            @PathVariable UUID id,
            @RequestBody @Valid MeetingInvitationUpdateRequest request) {
        meetingService.updateInvitation(id, request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã lưu mẫu giấy mời thành công")
                .build());
    }

    @Operation(summary = "Xem trước mẫu thư mời với dữ liệu đại biểu",
               description = "Biên dịch động các placeholder trong mẫu thư mời dựa trên thông tin phiên họp và đại biểu được chọn.")
    @PostMapping("/{id}/invitations/preview")
    public ResponseEntity<ApiResponse<MeetingInvitationPreviewResponse>> previewInvitation(
            @PathVariable UUID id,
            @RequestBody @Valid MeetingInvitationPreviewRequest request) {
        MeetingInvitationPreviewResponse response = meetingService.previewInvitation(id, request);
        return ResponseEntity.ok(ApiResponse.<MeetingInvitationPreviewResponse>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Xuất PDF thư mời của đại biểu",
               description = "Biên dịch động mẫu thư mời và xuất file PDF nhúng thông tin thực tế của đại biểu được chọn.")
    @PostMapping("/{id}/invitations/export-pdf")
    public ResponseEntity<byte[]> exportInvitationPdf(
            @PathVariable UUID id,
            @RequestBody @Valid MeetingInvitationPreviewRequest request) {
        byte[] pdfBytes = meetingService.exportInvitationPdf(id, request);
        
        String filename = "Giay_Moi_Hop.pdf";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @Operation(summary = "Trình duyệt cuộc họp",
               description = "Chuyển cuộc họp từ DRAFT → PENDING_APPROVAL để ban thư ký xét duyệt. Yêu cầu tất cả nội dung nghị sự phải được phê duyệt tài liệu trước.")
    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID approverUserId,
            @RequestParam(required = false) UUID approverRoleId) {
        meetingService.submitForApproval(id, approverUserId, approverRoleId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã trình duyệt cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Phê duyệt cuộc họp",
               description = "Chuyển từ PENDING_APPROVAL → APPROVED. Chỉ người có quyền phê duyệt (ban thư ký / admin) mới thực hiện được.")
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable UUID id) {
        meetingService.approve(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã phê duyệt cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Công bố cuộc họp (gửi thư mời)",
               description = "Chuyển từ APPROVED → PUBLISHED. Hệ thống sẽ gửi email mời đến toàn bộ người tham dự.")
    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<Void>> publish(@PathVariable UUID id) {
        meetingService.publish(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã công bố cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Đưa cuộc họp đã duyệt về bản nháp",
               description = "Chuyển trạng thái từ APPROVED → DRAFT để thiết lập lại thời gian khi cuộc họp không đủ thời gian công bố.")
    @PostMapping("/{id}/revert-draft")
    public ResponseEntity<ApiResponse<Void>> revertToDraft(@PathVariable UUID id) {
        meetingService.revertToDraft(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã đưa cuộc họp về bản nháp thành công")
                .build());
    }



    @Operation(summary = "Từ chối cuộc họp",
               description = "Chuyển từ PENDING_APPROVAL → REJECTED kèm lý do. Người tạo có thể chỉnh sửa và trình duyệt lại.")
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable UUID id, @RequestParam String rejectReason) {
        meetingService.reject(id, rejectReason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã từ chối cuộc họp")
                .build());
    }

    @Operation(summary = "Hủy cuộc họp",
               description = "Chuyển sang CANCELLED kèm lý do hủy. Chỉ người tạo hoặc admin thực hiện được. Không thể hoàn tác.")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable UUID id, @RequestParam String cancelReason) {
        meetingService.cancel(id, cancelReason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã hủy cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Kết thúc cuộc họp",
               description = "Chuyển sang CLOSED. Sau khi kết thúc, cuộc họp chỉ được xem, không chỉnh sửa thêm.")
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<Void>> close(@PathVariable UUID id) {
        meetingService.close(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã kết thúc cuộc họp")
                .build());
    }

    @Operation(summary = "Xóa cuộc họp",
               description = "Xóa cuộc họp đang ở trạng thái NHÁP (DRAFT).")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        meetingService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã xóa cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Khôi phục cuộc họp",
               description = "Khôi phục cuộc họp đã bị xóa. Chỉ áp dụng cho cuộc họp đã bị xóa bằng API DELETE.")
    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable UUID id) {
        meetingService.restore(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã khôi phục cuộc họp thành công")
                .build());
    }
}
