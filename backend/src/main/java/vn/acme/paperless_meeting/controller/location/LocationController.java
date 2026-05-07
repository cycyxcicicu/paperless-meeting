package vn.acme.paperless_meeting.controller.location;

import java.util.UUID;
import org.springframework.data.domain.Pageable;
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
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.location.LocationUpsertRequest;
import vn.acme.paperless_meeting.dto.response.location.LocationResponse;
import vn.acme.paperless_meeting.service.location.LocationService;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationController {
	LocationService locationService;

	@GetMapping
	public ApiResponse<PageResponse<LocationResponse>> findAll(
			@org.springframework.web.bind.annotation.RequestParam(required = false) String keyword,
			@org.springframework.web.bind.annotation.RequestParam(required = false, name = "type") String type,
			Pageable pageable) {
		return ApiResponse.<PageResponse<LocationResponse>>builder()
				.success(true)
				.message("Lấy danh sách địa điểm thành công")
				.data(locationService.findAll(keyword, type, pageable))
				.build();
	}

	@GetMapping("/{id}")
	public ApiResponse<LocationResponse> findById(@PathVariable UUID id) {
		return ApiResponse.<LocationResponse>builder()
				.success(true)
				.message("Lấy thông tin địa điểm thành công")
				.data(locationService.findById(id))
				.build();
	}

	@PostMapping
	public ApiResponse<LocationResponse> create(@Valid @RequestBody LocationUpsertRequest request) {
		return ApiResponse.<LocationResponse>builder()
				.success(true)
				.message("Tạo địa điểm thành công")
				.data(locationService.create(request))
				.build();
	}

	@PutMapping("/{id}")
	public ApiResponse<LocationResponse> update(@PathVariable UUID id,
			@Valid @RequestBody LocationUpsertRequest request) {
		return ApiResponse.<LocationResponse>builder()
				.success(true)
				.message("Cập nhật địa điểm thành công")
				.data(locationService.update(id, request))
				.build();
	}

	@DeleteMapping("/{id}")
	public ApiResponse<Void> delete(@PathVariable UUID id) {
		locationService.delete(id);
		return ApiResponse.<Void>builder()
				.success(true)
				.message("Xóa địa điểm thành công")
				.build();
	}
}
