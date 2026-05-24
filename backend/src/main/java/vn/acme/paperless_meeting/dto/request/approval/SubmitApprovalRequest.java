package vn.acme.paperless_meeting.dto.request.approval;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Getter
@Setter
public class SubmitApprovalRequest {

    @NotNull(message = "Vui lòng chọn loại tài nguyên cần trình duyệt")
    private ResourceType resourceType;

    @NotNull(message = "Vui lòng chọn tài nguyên cần trình duyệt")
    private UUID resourceId;

    private String note;

    private UUID approverUserId;
    private UUID approverRoleId;

    @jakarta.validation.constraints.AssertTrue(message = "Vui lòng chọn chính xác một Người duyệt hoặc một Chức vụ duyệt")
    private boolean isApproverValid() {
        return (approverUserId != null) ^ (approverRoleId != null);
    }
}

