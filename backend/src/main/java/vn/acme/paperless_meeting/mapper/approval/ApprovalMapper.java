package vn.acme.paperless_meeting.mapper.approval;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.acme.paperless_meeting.dto.response.approval.ApprovalRequestResponse;
import vn.acme.paperless_meeting.dto.response.approval.ApprovalStepResponse;
import vn.acme.paperless_meeting.entity.ApprovalRequest;
import vn.acme.paperless_meeting.entity.ApprovalStep;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface ApprovalMapper {

    @Mapping(target = "requestedById", source = "requestedBy.id")
    @Mapping(target = "requestedByName", source = "requestedBy.fullName")
    @Mapping(target = "steps", source = "approvalStepList")
    ApprovalRequestResponse toResponse(ApprovalRequest approvalRequest);

    @Mapping(target = "approverUserId", source = "approverUser.id")
    @Mapping(target = "approverUserName", source = "approverUser.fullName")
    @Mapping(target = "approverRoleId", source = "approverRole.id")
    @Mapping(target = "approverRoleName", source = "approverRole.roleName")
    ApprovalStepResponse toStepResponse(ApprovalStep approvalStep);
}
