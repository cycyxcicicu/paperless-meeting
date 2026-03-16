package vn.acme.paperless_meeting.controller.permission;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.permission.PermissionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.permission.PermissionResponse;
import vn.acme.paperless_meeting.service.permission.PermissionService;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionController {
    PermissionService permissionService;

    @GetMapping
    public ApiResponse<List<PermissionResponse>> findAll() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .success(true)
                .message("Lấy danh sách quyền thành công")
                .data(permissionService.findAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<PermissionResponse> findById(@PathVariable UUID id) {
        return ApiResponse.<PermissionResponse>builder()
                .success(true)
                .message("Lấy thông tin quyền thành công")
                .data(permissionService.findById(id))
                .build();
    }

    @PostMapping
    public ApiResponse<PermissionResponse> create(@Valid @RequestBody PermissionUpsertRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .success(true)
                .message("Tạo quyền thành công")
                .data(permissionService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<PermissionResponse> update(@PathVariable UUID id,
            @Valid @RequestBody PermissionUpsertRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .success(true)
                .message("Cập nhật quyền thành công")
                .data(permissionService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        permissionService.delete(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa quyền thành công")
                .build();
    }
}
