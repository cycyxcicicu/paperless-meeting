package vn.acme.paperless_meeting.controller.opinion;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.opinion.OpinionRequest;
import vn.acme.paperless_meeting.dto.response.opinion.OpinionResponse;
import vn.acme.paperless_meeting.service.opinion.OpinionService;

@RestController
@RequestMapping("/meetings/{meetingId}/opinions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Opinion", description = "Quản lý ý kiến đóng góp của đại biểu trong cuộc họp")
public class OpinionController {

    OpinionService opinionService;

    @Operation(summary = "Danh sách ý kiến đóng góp của cuộc họp")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<List<OpinionResponse>>> getOpinions(@PathVariable UUID meetingId) {
        return ResponseEntity.ok(ApiResponse.<List<OpinionResponse>>builder()
                .success(true)
                .data(opinionService.getOpinions(meetingId))
                .build());
    }

    @Operation(summary = "Đại biểu gửi ý kiến đóng góp mới")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<OpinionResponse>> createOpinion(
            @PathVariable UUID meetingId,
            @RequestBody @Valid OpinionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<OpinionResponse>builder()
                .success(true)
                .data(opinionService.createOpinion(meetingId, request))
                .message("Gửi ý kiến đóng góp thành công")
                .build());
    }
}
