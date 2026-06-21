package vn.acme.paperless_meeting.dto.request.document;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocTemplateRequest {
    @NotBlank(message = "Tên mẫu không được để trống")
    private String name;

    @NotBlank(message = "Mã mẫu không được để trống")
    private String code;

    private String contentJson;

    private String templateType; // e.g. INVITATION

    private String status; // e.g. ACTIVE, DRAFT, INACTIVE
}
