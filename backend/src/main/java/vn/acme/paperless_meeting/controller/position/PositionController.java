package vn.acme.paperless_meeting.controller.position;

import java.util.List;
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
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.position.PositionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.dto.response.position.PositionStatsResponse;
import vn.acme.paperless_meeting.service.position.PositionService;

@RestController
@RequestMapping("/positions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PositionController {

    PositionService positionService;

    /**
     * Get all positions
     */
    @GetMapping
    public ApiResponse<PageResponse<PositionResponse>> findAll(
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        return ApiResponse.<PageResponse<PositionResponse>>builder()
                .success(true)
                .message("Lấy danh sách chức vụ thành công")
                .data(positionService.findAll(search, pageable))
                .build();
    }

    /**
     * Get position stats
     */
    @GetMapping("/stats")
    public ApiResponse<PositionStatsResponse> getStats() {
        return ApiResponse.<PositionStatsResponse>builder()
                .success(true)
                .message("Lấy thông số thống kê chức vụ thành công")
                .data(positionService.getStats())
                .build();
    }


    /**
     * Get position by id
     */
    @GetMapping("/{id}")
    public ApiResponse<PositionResponse> findById(@PathVariable UUID id) {
        return ApiResponse.<PositionResponse>builder()
                .success(true)
                .message("Lấy thông tin chức vụ thành công")
                .data(positionService.findById(id))
                .build();
    }

    /**
     * Create new position
     */
    @PostMapping
    public ApiResponse<PositionResponse> create(@Valid @RequestBody PositionUpsertRequest request) {
        return ApiResponse.<PositionResponse>builder()
                .success(true)
                .message("Tạo chức vụ thành công")
                .data(positionService.create(request))
                .build();
    }

    /**
     * Update position
     */
    @PutMapping("/{id}")
    public ApiResponse<PositionResponse> update(@PathVariable UUID id,
            @Valid @RequestBody PositionUpsertRequest request) {
        return ApiResponse.<PositionResponse>builder()
                .success(true)
                .message("Cập nhật chức vụ thành công")
                .data(positionService.update(id, request))
                .build();
    }

    /**
     * Delete position
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        positionService.delete(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa chức vụ thành công")
                .build();
    }
}
