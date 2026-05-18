package vn.acme.paperless_meeting.controller.document;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.document.AttachDocumentRequest;
import vn.acme.paperless_meeting.dto.response.document.DocumentResponse;
import vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse;
import vn.acme.paperless_meeting.service.document.DocumentService;

@RestController
@RequestMapping
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Document", description = "Quản lý tài liệu cuộc họp")
public class DocumentController {

    DocumentService documentService;

    // ========== NHÓM A — Document CRUD ==========

    @Operation(summary = "Upload file tài liệu lên MinIO",
               description = "Upload file (PDF/DOCX/XLSX/PPTX/PNG/JPG/ZIP, tối đa 50MB). Trả về Document đã tạo kèm URL file.")
    @PostMapping(value = "/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String docType,
            @RequestParam(required = false) String note) {

        DocumentResponse response = documentService.uploadDocument(file, title, docType, note);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<DocumentResponse>builder()
                        .success(true)
                        .code(201)
                        .message("Upload tài liệu thành công")
                        .data(response)
                        .build());
    }

    @Operation(summary = "Lấy chi tiết tài liệu theo ID")
    @GetMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocument(@PathVariable UUID id) {
        DocumentResponse response = documentService.getDocument(id);
        return ResponseEntity.ok(ApiResponse.<DocumentResponse>builder()
                .success(true)
                .code(200)
                .data(response)
                .build());
    }

    @Operation(summary = "Danh sách tài liệu của user hiện tại")
    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getMyDocuments() {
        List<DocumentResponse> response = documentService.getMyDocuments();
        return ResponseEntity.ok(ApiResponse.<List<DocumentResponse>>builder()
                .success(true)
                .code(200)
                .data(response)
                .build());
    }

    @Operation(summary = "Xóa tài liệu (chỉ DRAFT, chưa gắn vào meeting, là người tạo)")
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .code(200)
                .message("Đã xóa tài liệu thành công")
                .build());
    }

    // ========== NHÓM B — Meeting Document ==========

    @Operation(summary = "Gắn tài liệu vào cuộc họp",
               description = "Gắn Document đã upload vào Meeting. Có thể tùy chọn liên kết với Agenda Item cụ thể.")
    @PostMapping("/meetings/{meetingId}/documents")
    public ResponseEntity<ApiResponse<MeetingDocumentResponse>> attachToMeeting(
            @PathVariable UUID meetingId,
            @RequestBody AttachDocumentRequest request) {

        MeetingDocumentResponse response = documentService.attachToMeeting(meetingId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<MeetingDocumentResponse>builder()
                        .success(true)
                        .code(201)
                        .message("Đã gắn tài liệu vào cuộc họp thành công")
                        .data(response)
                        .build());
    }

    @Operation(summary = "Danh sách tài liệu của cuộc họp")
    @GetMapping("/meetings/{meetingId}/documents")
    public ResponseEntity<ApiResponse<List<MeetingDocumentResponse>>> getMeetingDocuments(
            @PathVariable UUID meetingId) {

        List<MeetingDocumentResponse> response = documentService.getMeetingDocuments(meetingId);
        return ResponseEntity.ok(ApiResponse.<List<MeetingDocumentResponse>>builder()
                .success(true)
                .code(200)
                .data(response)
                .build());
    }

    @Operation(summary = "Gỡ tài liệu khỏi cuộc họp (không xóa file gốc)")
    @DeleteMapping("/meetings/{meetingId}/documents/{meetingDocId}")
    public ResponseEntity<ApiResponse<Void>> detachFromMeeting(
            @PathVariable UUID meetingId,
            @PathVariable UUID meetingDocId) {

        documentService.detachFromMeeting(meetingId, meetingDocId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .code(200)
                .message("Đã gỡ tài liệu khỏi cuộc họp thành công")
                .build());
    }

    @Operation(summary = "Cập nhật thông tin gắn tài liệu (usageType, requiredBeforeMeeting, agendaItem)")
    @PutMapping("/meetings/{meetingId}/documents/{meetingDocId}")
    public ResponseEntity<ApiResponse<MeetingDocumentResponse>> updateMeetingDocument(
            @PathVariable UUID meetingId,
            @PathVariable UUID meetingDocId,
            @RequestBody AttachDocumentRequest request) {

        MeetingDocumentResponse response = documentService.updateMeetingDocument(meetingId, meetingDocId, request);
        return ResponseEntity.ok(ApiResponse.<MeetingDocumentResponse>builder()
                .success(true)
                .code(200)
                .message("Cập nhật thông tin tài liệu thành công")
                .data(response)
                .build());
    }
}
