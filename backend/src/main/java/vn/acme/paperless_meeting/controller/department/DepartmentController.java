package vn.acme.paperless_meeting.controller.department;

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
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.service.department.DepartmentService;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DepartmentController {
    DepartmentService departmentService;

    @GetMapping
    public ApiResponse<List<DepartmentResponse>> findAll() {
        return ApiResponse.<List<DepartmentResponse>>builder()
                .success(true)
                .message("Lấy danh sách phòng ban thành công")
                .data(departmentService.findAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<DepartmentResponse> findById(@PathVariable UUID id) {
        return ApiResponse.<DepartmentResponse>builder()
                .success(true)
                .message("Lấy thông tin phòng ban thành công")
                .data(departmentService.findById(id))
                .build();
    }

    @GetMapping("/{id}/children")
    public ApiResponse<PageResponse<DepartmentResponse>> getChildrenPage(
            @PathVariable UUID id,
            @RequestParam(required = false) String keyword,
            org.springframework.data.domain.Pageable pageable) {
        return ApiResponse.<PageResponse<DepartmentResponse>>builder()
                .success(true)
                .message("Lấy danh sách phòng con thành công")
                .data(departmentService.getChildrenPage(id, keyword, pageable))
                .build();
    }

    @PostMapping
    public ApiResponse<DepartmentResponse> create(@Valid @RequestBody DepartmentUpsertRequest request) {
        return ApiResponse.<DepartmentResponse>builder()
                .success(true)
                .message("Tạo phòng ban thành công")
                .data(departmentService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<DepartmentResponse> update(@PathVariable UUID id,
            @Valid @RequestBody DepartmentUpsertRequest request) {
        return ApiResponse.<DepartmentResponse>builder()
                .success(true)
                .message("Cập nhật phòng ban thành công")
                .data(departmentService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        departmentService.delete(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa phòng ban thành công")
                .build();
    }
}
