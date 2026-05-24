package vn.acme.paperless_meeting.controller.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
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
            @RequestParam(required = false) MeetingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            Pageable pageable) {

        PageResponse<MeetingResponse> response = meetingService.findAll(keyword, status, fromDate, toDate, pageable);
        return ResponseEntity.ok(ApiResponse.<PageResponse<MeetingResponse>>builder()
                .data(response)
                .build());
    }

    @Operation(summary = "Chi tiết cuộc họp theo ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingResponse>> findById(@PathVariable UUID id) {
        MeetingResponse response = meetingService.findById(id);
        return ResponseEntity.ok(ApiResponse.<MeetingResponse>builder()
                .data(response)
                .build());
    }

    @Operation(summary = "Tạo cuộc họp mới",
               description = "Tạo cuộc họp ở trạng thái DRAFT. Người tạo tự động trở thành chủ tọa. Cần điền đầy đủ tiêu đề, địa điểm, thời gian bắt đầu/kết thúc.")
    @PostMapping
    public ResponseEntity<ApiResponse<MeetingResponse>> create(@RequestBody @Valid MeetingUpsertRequest request) {
        MeetingResponse response = meetingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<MeetingResponse>builder()
                .data(response)
                .build());
    }

    @Operation(summary = "Cập nhật thông tin cuộc họp",
               description = "Chỉ cho phép khi cuộc họp đang ở trạng thái DRAFT hoặc REJECTED. Chỉ người tạo hoặc admin mới được sửa.")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingResponse>> update(@PathVariable UUID id, @RequestBody @Valid MeetingUpsertRequest request) {
        MeetingResponse response = meetingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<MeetingResponse>builder()
                .data(response)
                .build());
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
                .message("Đã trình duyệt cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Phê duyệt cuộc họp",
               description = "Chuyển từ PENDING_APPROVAL → APPROVED. Chỉ người có quyền phê duyệt (ban thư ký / admin) mới thực hiện được.")
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable UUID id) {
        meetingService.approve(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã phê duyệt cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Công bố cuộc họp (gửi thư mời)",
               description = "Chuyển từ APPROVED → PUBLISHED. Hệ thống sẽ gửi email mời đến toàn bộ người tham dự.")
    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<Void>> publish(@PathVariable UUID id) {
        meetingService.publish(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã công bố cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Từ chối cuộc họp",
               description = "Chuyển từ PENDING_APPROVAL → REJECTED kèm lý do. Người tạo có thể chỉnh sửa và trình duyệt lại.")
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable UUID id, @RequestParam String rejectReason) {
        meetingService.reject(id, rejectReason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã từ chối cuộc họp")
                .build());
    }

    @Operation(summary = "Hủy cuộc họp",
               description = "Chuyển sang CANCELLED kèm lý do hủy. Chỉ người tạo hoặc admin thực hiện được. Không thể hoàn tác.")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable UUID id, @RequestParam String cancelReason) {
        meetingService.cancel(id, cancelReason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã hủy cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Kết thúc cuộc họp",
               description = "Chuyển sang CLOSED. Sau khi kết thúc, cuộc họp chỉ được xem, không chỉnh sửa thêm.")
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<Void>> close(@PathVariable UUID id) {
        meetingService.close(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã kết thúc cuộc họp")
                .build());
    }

    @Operation(summary = "Xóa cuộc họp",
               description = "Xóa cuộc họp đang ở trạng thái NHÁP (DRAFT).")
    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        meetingService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã xóa cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Khôi phục cuộc họp",
               description = "Khôi phục cuộc họp đã bị xóa. Chỉ áp dụng cho cuộc họp đã bị xóa bằng API DELETE.")
    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable UUID id) {
        meetingService.restore(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã khôi phục cuộc họp thành công")
                .build());
    }
}
