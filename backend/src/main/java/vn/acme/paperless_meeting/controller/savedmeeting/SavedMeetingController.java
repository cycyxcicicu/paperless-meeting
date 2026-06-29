package vn.acme.paperless_meeting.controller.savedmeeting;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.service.savedmeeting.SavedMeetingService;

@RestController
@RequestMapping("/saved-meetings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Saved Meeting", description = "Quản lý lưu trữ tài liệu phiên họp cá nhân (Bookmarks)")
public class SavedMeetingController {

    SavedMeetingService savedMeetingService;

    @Operation(summary = "Lưu hoặc Hủy lưu tài liệu phiên họp (Toggle)")
    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<Boolean>> toggleSaveMeeting(@RequestParam UUID meetingId) {
        boolean isSaved = savedMeetingService.toggleSaveMeeting(meetingId);
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .data(isSaved)
                .message(isSaved ? "Lưu tài liệu phiên họp thành công" : "Đã hủy lưu tài liệu phiên họp")
                .build());
    }

    @Operation(summary = "Danh sách phiên họp đã lưu tài liệu")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MeetingResponse>>> getSavedMeetings(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<MeetingResponse> response = savedMeetingService.getSavedMeetings(pageable);
        return ResponseEntity.ok(ApiResponse.<PageResponse<MeetingResponse>>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Kiểm tra phiên họp đã được lưu tài liệu chưa")
    @GetMapping("/check/{meetingId}")
    public ResponseEntity<ApiResponse<Boolean>> isMeetingSaved(@PathVariable UUID meetingId) {
        boolean isSaved = savedMeetingService.isMeetingSaved(meetingId);
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .data(isSaved)
                .build());
    }
}
