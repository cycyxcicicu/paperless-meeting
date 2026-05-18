package vn.acme.paperless_meeting.controller.approval;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.approval.ApprovalDecisionRequest;
import vn.acme.paperless_meeting.dto.request.approval.SubmitApprovalRequest;
import vn.acme.paperless_meeting.dto.response.approval.ApprovalRequestResponse;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import vn.acme.paperless_meeting.service.approval.ApprovalService;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Approval", description = "Quản lý quy trình trình duyệt/phê duyệt tài nguyên")
public class ApprovalController {

    ApprovalService approvalService;

    @Operation(summary = "Trình duyệt tài nguyên")
    @PostMapping
    public ApiResponse<ApprovalRequestResponse> submit(@Valid @RequestBody SubmitApprovalRequest request) {
        return ApiResponse.<ApprovalRequestResponse>builder()
                .success(true)
                .message("Trình duyệt thành công")
                .data(approvalService.submit(request))
                .build();
    }

    @Operation(summary = "Phê duyệt yêu cầu")
    @PutMapping("/{approvalId}/approve")
    public ApiResponse<ApprovalRequestResponse> approve(@PathVariable UUID approvalId,
                                                         @RequestBody(required = false) ApprovalDecisionRequest request) {
        return ApiResponse.<ApprovalRequestResponse>builder()
                .success(true)
                .message("Phê duyệt thành công")
                .data(approvalService.approve(approvalId, request))
                .build();
    }

    @Operation(summary = "Từ chối yêu cầu")
    @PutMapping("/{approvalId}/reject")
    public ApiResponse<ApprovalRequestResponse> reject(@PathVariable UUID approvalId,
                                                        @RequestBody(required = false) ApprovalDecisionRequest request) {
        return ApiResponse.<ApprovalRequestResponse>builder()
                .success(true)
                .message("Từ chối thành công")
                .data(approvalService.reject(approvalId, request))
                .build();
    }

    @Operation(summary = "Lấy chi tiết yêu cầu duyệt")
    @GetMapping("/{approvalId}")
    public ApiResponse<ApprovalRequestResponse> getById(@PathVariable UUID approvalId) {
        return ApiResponse.<ApprovalRequestResponse>builder()
                .success(true)
                .message("Lấy chi tiết yêu cầu duyệt thành công")
                .data(approvalService.getById(approvalId))
                .build();
    }

    @Operation(summary = "Lấy lịch sử approval theo tài nguyên")
    @GetMapping("/history")
    public ApiResponse<List<ApprovalRequestResponse>> getHistory(@RequestParam ResourceType resourceType,
                                                                  @RequestParam UUID resourceId) {
        return ApiResponse.<List<ApprovalRequestResponse>>builder()
                .success(true)
                .message("Lấy lịch sử duyệt thành công")
                .data(approvalService.getHistory(resourceType, resourceId))
                .build();
    }
}
