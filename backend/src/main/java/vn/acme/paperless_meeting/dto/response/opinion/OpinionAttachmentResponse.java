package vn.acme.paperless_meeting.dto.response.opinion;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class OpinionAttachmentResponse {
    private UUID documentId;
    private String fileName;
    private String fileUrl;
}
