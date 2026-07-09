package vn.acme.paperless_meeting.controller.user;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
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
import java.io.InputStream;
import org.springframework.core.io.Resource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.request.user.UserUpdateRequest;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.dto.response.user.UserStatsResponse;
import vn.acme.paperless_meeting.dto.response.user.UserAvatarResponse;
import vn.acme.paperless_meeting.service.User.UserService;
import vn.acme.paperless_meeting.service.document.FileStorageService;
import vn.acme.paperless_meeting.service.document.StorageResult;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserCrudController {
    UserService userService;
    FileStorageService fileStorageService;

    @PostMapping(value = "/avatar/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserAvatarResponse> uploadAvatar(@RequestPart("file") MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/png") && !contentType.equals("image/jpeg") && !contentType.equals("image/jpg"))) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        StorageResult result = fileStorageService.store(file);
        
        return ApiResponse.<UserAvatarResponse>builder()
                .success(true)
                .message("Tải ảnh đại diện thành công")
                .data(new UserAvatarResponse("/api/users/avatar/view/" + result.getStorageKey()))
                .build();
    }

    @GetMapping("/avatar/view/{filename}")
    public ResponseEntity<Resource> viewAvatar(@PathVariable String filename) {
        InputStream stream = fileStorageService.getFileStream(filename);
        Resource resource = new InputStreamResource(stream);

        String contentType = "application/octet-stream";
        String lowerName = filename.toLowerCase();
        if (lowerName.endsWith(".png")) {
            contentType = "image/png";
        } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
    
    @PostMapping("/register")
    public ApiResponse<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        UserResponse response = userService.create(request);
        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Tạo người dùng thành công")
                .data(response)
                .build();
    }

    @GetMapping("/stats")
    public ApiResponse<UserStatsResponse> getStats() {
        return ApiResponse.<UserStatsResponse>builder()
                .success(true)
                .message("Lấy thông số thống kê người dùng thành công")
                .data(userService.getStats())
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, name = "departmentId") UUID departmentId,
            @RequestParam(required = false, name = "roleCode") String roleCode,
            Pageable pageable) {
        return ApiResponse.<PageResponse<UserResponse>>builder()
            .success(true)
            .message("Lấy danh sách người dùng thành công")
            .data(userService.findAll(keyword, status, departmentId, roleCode, pageable))
            .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> findById(@PathVariable UUID id) {
        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Lấy thông tin người dùng thành công")
                .data(userService.findById(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<UserResponse> update(@PathVariable UUID id, @Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Cập nhật người dùng thành công")
                .data(userService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa người dùng thành công")
                .build();
    }
}
