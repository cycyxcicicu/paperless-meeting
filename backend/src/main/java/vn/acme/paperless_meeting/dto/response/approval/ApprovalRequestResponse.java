package vn.acme.paperless_meeting.dto.response.approval;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.ApprovalStatus;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Getter
@Setter
@Builder
public class ApprovalRequestResponse {

    private UUID id;
    private ResourceType resourceType;
    private UUID resourceId;
    private LocalDateTime requestedAt;
    private ApprovalStatus status;
    private String note;
    private UUID requestedById;
    private String requestedByName;
    private List<ApprovalStepResponse> steps;
}
