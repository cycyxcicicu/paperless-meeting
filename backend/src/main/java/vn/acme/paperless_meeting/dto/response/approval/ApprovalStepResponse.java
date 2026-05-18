package vn.acme.paperless_meeting.dto.response.approval;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.ApprovalDecision;

@Getter
@Setter
@Builder
public class ApprovalStepResponse {

    private UUID id;
    private Integer stepNo;
    private ApprovalDecision decision;
    private LocalDateTime decidedAt;
    private String comment;
    private UUID approverUserId;
    private String approverUserName;
    private UUID approverRoleId;
    private String approverRoleName;
}
