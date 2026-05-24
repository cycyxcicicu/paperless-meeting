package vn.acme.paperless_meeting.dto.response.document;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.MeetingDocumentUsageType;

@Getter
@Setter
@Builder
public class MeetingDocumentResponse {
    private UUID id;
    private DocumentResponse document;
    private MeetingDocumentUsageType usageType;
    private Boolean requiredBeforeMeeting;
    private Boolean isConfidential;
    private UUID agendaItemId;
    private String agendaItemTitle;
}
