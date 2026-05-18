package vn.acme.paperless_meeting.dto.response.agenda;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.MeetingDocumentUsageType;

@Getter
@Setter
@Builder
public class AgendaDocumentResponse {
    private UUID documentId;
    private String title;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private MeetingDocumentUsageType usageType;
}
