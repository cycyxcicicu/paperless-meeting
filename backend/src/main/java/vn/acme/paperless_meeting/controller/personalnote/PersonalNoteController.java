package vn.acme.paperless_meeting.controller.personalnote;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.base.PageResponse;
import vn.acme.paperless_meeting.dto.request.personalnote.PersonalNoteRequest;
import vn.acme.paperless_meeting.dto.response.personalnote.PersonalNoteResponse;
import vn.acme.paperless_meeting.service.personalnote.PersonalNoteService;

@RestController
@RequestMapping("/personal-notes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Personal Note", description = "Quản lý ghi chú cá nhân của đại biểu trong cuộc họp")
public class PersonalNoteController {

    PersonalNoteService personalNoteService;

    @Operation(summary = "Tạo ghi chú cá nhân mới")
    @PostMapping
    public ResponseEntity<ApiResponse<PersonalNoteResponse>> createNote(
            @Valid @RequestBody PersonalNoteRequest request) {
        PersonalNoteResponse response = personalNoteService.createNote(request);
        return ResponseEntity.ok(ApiResponse.<PersonalNoteResponse>builder()
                .success(true)
                .data(response)
                .message("Tạo ghi chú thành công")
                .build());
    }

    @Operation(summary = "Cập nhật ghi chú cá nhân")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonalNoteResponse>> updateNote(
            @PathVariable UUID id,
            @Valid @RequestBody PersonalNoteRequest request) {
        PersonalNoteResponse response = personalNoteService.updateNote(id, request);
        return ResponseEntity.ok(ApiResponse.<PersonalNoteResponse>builder()
                .success(true)
                .data(response)
                .message("Cập nhật ghi chú thành công")
                .build());
    }

    @Operation(summary = "Xóa ghi chú cá nhân")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(@PathVariable UUID id) {
        personalNoteService.deleteNote(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa ghi chú thành công")
                .build());
    }

    @Operation(summary = "Lấy danh sách ghi chú cá nhân trong một cuộc họp")
    @GetMapping("/meeting/{meetingId}")
    public ResponseEntity<ApiResponse<List<PersonalNoteResponse>>> getNotesForMeeting(@PathVariable UUID meetingId) {
        List<PersonalNoteResponse> response = personalNoteService.getNotesForMeeting(meetingId);
        return ResponseEntity.ok(ApiResponse.<List<PersonalNoteResponse>>builder()
                .success(true)
                .data(response)
                .build());
    }

    @Operation(summary = "Lấy tất cả ghi chú cá nhân của người dùng (Kho ghi chú)")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PersonalNoteResponse>>> getAllNotes(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<PersonalNoteResponse> response = personalNoteService.getAllNotes(pageable);
        return ResponseEntity.ok(ApiResponse.<PageResponse<PersonalNoteResponse>>builder()
                .success(true)
                .data(response)
                .build());
    }
}
