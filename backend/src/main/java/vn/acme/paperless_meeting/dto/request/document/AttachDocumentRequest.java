package vn.acme.paperless_meeting.dto.request.document;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.MeetingDocumentUsageType;

@Getter
@Setter
public class AttachDocumentRequest {
    private UUID documentId;
    private MeetingDocumentUsageType usageType;
    private Boolean requiredBeforeMeeting;
    private Boolean isConfidential;
    private UUID agendaItemId; // optional — nếu gắn vào agenda item cụ thể
}
