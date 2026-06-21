package vn.acme.paperless_meeting.controller.audit;

import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.response.audit.AuditLogResponse;
import vn.acme.paperless_meeting.dto.response.audit.AuditLogStatsResponse;
import vn.acme.paperless_meeting.service.audit.AuditLogService;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuditLogController {
    AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<PageResponse<AuditLogResponse>> findAll(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ApiResponse.<PageResponse<AuditLogResponse>>builder()
                .success(true)
                .message("Lấy danh sách nhật ký hệ thống thành công")
                .data(auditLogService.findAll(keyword, pageable))
                .build();
    }

    @GetMapping("/stats")
    public ApiResponse<AuditLogStatsResponse> getStats() {
        return ApiResponse.<AuditLogStatsResponse>builder()
                .success(true)
                .message("Lấy thông số thống kê nhật ký hệ thống thành công")
                .data(auditLogService.getStats())
                .build();
    }
}
