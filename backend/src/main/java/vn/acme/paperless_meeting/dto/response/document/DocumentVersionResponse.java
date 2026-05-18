package vn.acme.paperless_meeting.dto.response.document;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class DocumentVersionResponse {
    private UUID id;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String checksum;
    private LocalDateTime createdAt;
    private String note;
}
