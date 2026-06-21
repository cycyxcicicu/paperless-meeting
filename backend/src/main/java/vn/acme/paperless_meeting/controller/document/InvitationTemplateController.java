package vn.acme.paperless_meeting.controller.document;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
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
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.dto.base.ApiResponse;
import vn.acme.paperless_meeting.dto.request.document.DocTemplateRequest;
import vn.acme.paperless_meeting.dto.request.document.ExportPdfRequest;
import vn.acme.paperless_meeting.dto.response.document.DocTemplateResponse;
import vn.acme.paperless_meeting.service.document.InvitationPdfService;
import vn.acme.paperless_meeting.service.document.InvitationTemplateService;

@Slf4j
@RestController
@RequestMapping("/invitation-templates")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InvitationTemplateController {

    InvitationTemplateService invitationTemplateService;
    InvitationPdfService invitationPdfService;

    @PostMapping
    public ApiResponse<DocTemplateResponse> create(@Valid @RequestBody DocTemplateRequest request) {
        return ApiResponse.<DocTemplateResponse>builder()
                .success(true)
                .message("Tạo mẫu thư mời thành công")
                .data(invitationTemplateService.createTemplate(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<DocTemplateResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody DocTemplateRequest request) {
        return ApiResponse.<DocTemplateResponse>builder()
                .success(true)
                .message("Cập nhật mẫu thư mời thành công")
                .data(invitationTemplateService.updateTemplate(id, request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<DocTemplateResponse> get(@PathVariable UUID id) {
        return ApiResponse.<DocTemplateResponse>builder()
                .success(true)
                .message("Lấy chi tiết mẫu thư mời thành công")
                .data(invitationTemplateService.getTemplate(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<DocTemplateResponse>> list() {
        return ApiResponse.<List<DocTemplateResponse>>builder()
                .success(true)
                .message("Lấy danh sách mẫu thư mời thành công")
                .data(invitationTemplateService.listTemplates())
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        invitationTemplateService.deleteTemplate(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa mẫu thư mời thành công")
                .build();
    }

    @PostMapping("/export-pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestBody ExportPdfRequest request) {
        byte[] pdfBytes = invitationPdfService.generatePdf(request.getTemplateData(), request.getSampleData());

        String maMau = "invitation";
        if (request.getTemplateData() != null && request.getTemplateData().containsKey("maMau")) {
            maMau = String.valueOf(request.getTemplateData().get("maMau"));
        }
        String filename = maMau + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("no-cache, no-store, must-revalidate");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
