package vn.acme.paperless_meeting.controller.meeting;

import java.time.LocalDateTime;
import java.util.UUID;

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
public class MeetingController {

    MeetingService meetingService;

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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingResponse>> findById(@PathVariable UUID id) {
        MeetingResponse response = meetingService.findById(id);
        return ResponseEntity.ok(ApiResponse.<MeetingResponse>builder()
                .data(response)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MeetingResponse>> create(@RequestBody @Valid MeetingUpsertRequest request) {
        MeetingResponse response = meetingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<MeetingResponse>builder()
                .data(response)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingResponse>> update(@PathVariable UUID id, @RequestBody @Valid MeetingUpsertRequest request) {
        MeetingResponse response = meetingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.<MeetingResponse>builder()
                .data(response)
                .build());
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(@PathVariable UUID id) {
        meetingService.submitForApproval(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã trình duyệt cuộc họp thành công")
                .build());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable UUID id) {
        meetingService.approve(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã phê duyệt cuộc họp thành công")
                .build());
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<Void>> publish(@PathVariable UUID id) {
        meetingService.publish(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã công bố cuộc họp thành công")
                .build());
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable UUID id, @RequestParam String rejectReason) {
        meetingService.reject(id, rejectReason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã từ chối cuộc họp")
                .build());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable UUID id, @RequestParam String cancelReason) {
        meetingService.cancel(id, cancelReason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã hủy cuộc họp thành công")
                .build());
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<Void>> close(@PathVariable UUID id) {
        meetingService.close(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã kết thúc cuộc họp")
                .build());
    }
}
