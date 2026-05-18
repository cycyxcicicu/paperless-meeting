package vn.acme.paperless_meeting.controller.motion;

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
import vn.acme.paperless_meeting.dto.request.motion.MotionUpsertRequest;
import vn.acme.paperless_meeting.dto.request.vote.VoteRequest;
import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.dto.response.motion.VoteStatisticsResponse;
import vn.acme.paperless_meeting.service.motion.MotionService;

@RestController
@RequestMapping
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Motion & Vote", description = "Quản lý vấn đề biểu quyết và phiên bỏ phiếu trong cuộc họp")
public class MotionController {

    MotionService motionService;

    @Operation(summary = "Danh sách vấn đề biểu quyết của đầu mục nghị sự",
               description = "Trả về tất cả motions thuộc một agenda item, kèm trạng thái và số liệu bỏ phiếu.")
    @GetMapping("/agenda-items/{agendaItemId}/motions")
    public ResponseEntity<ApiResponse<List<MotionResponse>>> getMotions(@PathVariable UUID agendaItemId) {
        return ResponseEntity.ok(ApiResponse.<List<MotionResponse>>builder()
                .data(motionService.getMotions(agendaItemId)).build());
    }

    @Operation(summary = "Tạo vấn đề biểu quyết mới",
               description = "Thêm một nội dung cần bỏ phiếu vào đầu mục nghị sự. Cần điền tiêu đề và danh sách lựa chọn.")
    @PostMapping("/agenda-items/{agendaItemId}/motions")
    public ResponseEntity<ApiResponse<MotionResponse>> createMotion(
            @PathVariable UUID agendaItemId, @RequestBody @Valid MotionUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<MotionResponse>builder()
                .data(motionService.createMotion(agendaItemId, request)).build());
    }

    @Operation(summary = "Cập nhật vấn đề biểu quyết",
               description = "Chỉnh sửa tiêu đề hoặc lựa chọn. Chỉ được phép khi phiên biểu quyết chưa bắt đầu.")
    @PutMapping("/motions/{id}")
    public ResponseEntity<ApiResponse<MotionResponse>> updateMotion(
            @PathVariable UUID id, @RequestBody @Valid MotionUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.<MotionResponse>builder()
                .data(motionService.updateMotion(id, request)).build());
    }

    @Operation(summary = "Xóa vấn đề biểu quyết",
               description = "Chỉ xóa được khi phiên biểu quyết chưa bắt đầu và chưa có phiếu nào.")
    @DeleteMapping("/motions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMotion(@PathVariable UUID id) {
        motionService.deleteMotion(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Đã xóa vấn đề biểu quyết thành công").build());
    }

    @Operation(summary = "Mở phiên biểu quyết",
               description = "Kích hoạt đếm ngược bỏ phiếu. Mặc định 5 phút, chỉnh qua ?durationMinutes=. Đại biểu chỉ có thể bỏ phiếu trong thời gian này.")
    @PostMapping("/motions/{id}/vote-start")
    public ResponseEntity<ApiResponse<MotionResponse>> startVote(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "5") Integer durationMinutes) {
        MotionResponse response = motionService.startVote(id, durationMinutes);
        return ResponseEntity.ok(ApiResponse.<MotionResponse>builder()
                .data(response)
                .message("Đã kích hoạt phiên biểu quyết thành công với thời gian " + durationMinutes + " phút")
                .build());
    }

    @Operation(summary = "Đóng phiên biểu quyết sớm",
               description = "Kết thúc phiên trước khi hết giờ. Kết quả được tính ngay lập tức từ các phiếu đã bỏ.")
    @PostMapping("/motions/{id}/vote-stop")
    public ResponseEntity<ApiResponse<MotionResponse>> stopVote(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<MotionResponse>builder()
                .data(motionService.stopVote(id))
                .message("Đã đóng phiên biểu quyết thành công").build());
    }

    @Operation(summary = "Đại biểu bỏ phiếu",
               description = "Chọn một trong các lựa chọn của motion. Mỗi đại biểu chỉ được bỏ một phiếu. Yêu cầu đã điểm danh có mặt.")
    @PostMapping("/motions/{id}/vote")
    public ResponseEntity<ApiResponse<MotionResponse>> castVote(
            @PathVariable UUID id, @RequestBody @Valid VoteRequest request) {
        return ResponseEntity.ok(ApiResponse.<MotionResponse>builder()
                .data(motionService.castVote(id, request.getOptionId()))
                .message("Đã thực hiện biểu quyết thành công").build());
    }

    @Operation(summary = "Xem kết quả biểu quyết",
               description = "Trả về số phiếu từng lựa chọn, tỷ lệ phần trăm và kết quả thắng/thua sau khi phiên kết thúc.")
    @GetMapping("/motions/{id}/vote-statistics")
    public ResponseEntity<ApiResponse<VoteStatisticsResponse>> getVoteStatistics(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.<VoteStatisticsResponse>builder()
                .data(motionService.getVoteStatistics(id))
                .message("Lấy thống kê biểu quyết thành công").build());
    }
}
