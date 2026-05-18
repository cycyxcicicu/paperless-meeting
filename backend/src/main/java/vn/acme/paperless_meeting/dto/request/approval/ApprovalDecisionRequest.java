package vn.acme.paperless_meeting.dto.request.approval;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalDecisionRequest {

    private String comment;

    private String rejectReason;
}
