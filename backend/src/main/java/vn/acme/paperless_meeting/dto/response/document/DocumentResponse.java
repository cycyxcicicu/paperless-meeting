package vn.acme.paperless_meeting.dto.response.document;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.DocumentStatus;
import vn.acme.paperless_meeting.entity.enums.DocumentType;

@Getter
@Setter
@Builder
public class DocumentResponse {
    private UUID id;
    private String title;
    private DocumentType docType;
    private DocumentStatus status;
    private String createdByName;
    private LocalDateTime createdAt;
    private DocumentVersionResponse currentVersion;
}
