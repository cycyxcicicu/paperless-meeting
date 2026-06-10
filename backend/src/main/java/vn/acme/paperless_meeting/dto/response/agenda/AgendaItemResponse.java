package vn.acme.paperless_meeting.dto.response.agenda;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;

import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;

@Getter
@Setter
@Builder
public class AgendaItemResponse {
    private UUID id;
    private String title;
    private String content;
    private Integer orderNo;
    private Integer durationEst;
    private AgendaItemStatus status;
    private UUID preparedByUserId;
    private String preparedByFullName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String rejectReason;
    private LocalDateTime prepDeadline;
    private UUID meetingId;
    private List<AgendaDocumentResponse> documents;
    private List<AgendaItemFeedbackResponse> feedbacks;
    private List<MotionResponse> motions;
    private String prepInstructions;
}
