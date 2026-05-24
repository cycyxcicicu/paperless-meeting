package vn.acme.paperless_meeting.controller.role;

import java.util.List;
import java.util.UUID;

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
import vn.acme.paperless_meeting.dto.request.role.RoleUpsertRequest;
import vn.acme.paperless_meeting.dto.response.role.RoleResponse;
import vn.acme.paperless_meeting.dto.response.role.RoleStatsResponse;
import vn.acme.paperless_meeting.service.role.RoleService;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleController {
    RoleService roleService;

    @GetMapping
    public ApiResponse<List<RoleResponse>> findAll(@RequestParam(required = false) String keyword) {
        return ApiResponse.<List<RoleResponse>>builder()
                .success(true)
                .message("Lấy danh sách vai trò thành công")
                .data(roleService.findAll(keyword))
                .build();
    }

    @GetMapping("/stats")
    public ApiResponse<RoleStatsResponse> getStats() {
        return ApiResponse.<RoleStatsResponse>builder()
                .success(true)
                .message("Lấy thống kê vai trò thành công")
                .data(roleService.getRoleStats())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<RoleResponse> findById(@PathVariable UUID id) {
        return ApiResponse.<RoleResponse>builder()
                .success(true)
                .message("Lấy thông tin vai trò thành công")
                .data(roleService.findById(id))
                .build();
    }

    @PostMapping
    public ApiResponse<RoleResponse> create(@Valid @RequestBody RoleUpsertRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .success(true)
                .message("Tạo vai trò thành công")
                .data(roleService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<RoleResponse> update(@PathVariable UUID id, @Valid @RequestBody RoleUpsertRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .success(true)
                .message("Cập nhật vai trò thành công")
                .data(roleService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        roleService.delete(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa vai trò thành công")
                .build();
    }
}
