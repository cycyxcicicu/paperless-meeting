package vn.acme.paperless_meeting.controller.motion;

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
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestParam;
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
public class MotionController {

    MotionService motionService;

    @GetMapping("/agenda-items/{agendaItemId}/motions")
    public ResponseEntity<ApiResponse<List<MotionResponse>>> getMotions(@PathVariable UUID agendaItemId) {
        List<MotionResponse> response = motionService.getMotions(agendaItemId);
        return ResponseEntity.ok(ApiResponse.<List<MotionResponse>>builder()
                .data(response)
                .build());
    }

    @PostMapping("/agenda-items/{agendaItemId}/motions")
    public ResponseEntity<ApiResponse<MotionResponse>> createMotion(
            @PathVariable UUID agendaItemId,
            @RequestBody @Valid MotionUpsertRequest request) {
        MotionResponse response = motionService.createMotion(agendaItemId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<MotionResponse>builder()
                .data(response)
                .build());
    }

    @PutMapping("/motions/{id}")
    public ResponseEntity<ApiResponse<MotionResponse>> updateMotion(
            @PathVariable UUID id,
            @RequestBody @Valid MotionUpsertRequest request) {
        MotionResponse response = motionService.updateMotion(id, request);
        return ResponseEntity.ok(ApiResponse.<MotionResponse>builder()
                .data(response)
                .build());
    }

    @DeleteMapping("/motions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMotion(@PathVariable UUID id) {
        motionService.deleteMotion(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã xóa vấn đề biểu quyết thành công")
                .build());
    }

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

    @PostMapping("/motions/{id}/vote-stop")
    public ResponseEntity<ApiResponse<MotionResponse>> stopVote(@PathVariable UUID id) {
        MotionResponse response = motionService.stopVote(id);
        return ResponseEntity.ok(ApiResponse.<MotionResponse>builder()
                .data(response)
                .message("Đã đóng phiên biểu quyết thành công")
                .build());
    }

    @PostMapping("/motions/{id}/vote")
    public ResponseEntity<ApiResponse<MotionResponse>> castVote(
            @PathVariable UUID id,
            @RequestBody @Valid VoteRequest request) {
        MotionResponse response = motionService.castVote(id, request.getOptionId());
        return ResponseEntity.ok(ApiResponse.<MotionResponse>builder()
                .data(response)
                .message("Đã thực hiện biểu quyết thành công")
                .build());
    }

    @GetMapping("/motions/{id}/vote-statistics")
    public ResponseEntity<ApiResponse<VoteStatisticsResponse>> getVoteStatistics(@PathVariable UUID id) {
        VoteStatisticsResponse response = motionService.getVoteStatistics(id);
        return ResponseEntity.ok(ApiResponse.<VoteStatisticsResponse>builder()
                .data(response)
                .message("Lấy thống kê biểu quyết thành công")
                .build());
    }
}
