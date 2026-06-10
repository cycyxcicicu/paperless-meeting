package vn.acme.paperless_meeting.dto.response.opinion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class OpinionResponse {
    private UUID id;
    private String delegateName;
    private String position;
    private String avatar;
    private String content;
    private LocalDateTime time;
    private String documentName;
    private List<OpinionAttachmentResponse> attachments;
}
