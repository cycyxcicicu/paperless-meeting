package vn.acme.paperless_meeting.dto.response.document;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.DocTemplateStatus;
import vn.acme.paperless_meeting.entity.enums.TemplateType;

@Getter
@Setter
public class DocTemplateResponse {
    private UUID id;
    private String name;
    private String code;
    private String contentJson;
    private TemplateType templateType;
    private DocTemplateStatus status;
    private LocalDateTime createdAt;
}
