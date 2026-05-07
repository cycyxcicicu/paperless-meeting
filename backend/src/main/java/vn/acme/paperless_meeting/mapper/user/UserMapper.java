package vn.acme.paperless_meeting.mapper.user;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.request.user.UserUpdateRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentSimpleResponse;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.dto.response.role.RoleSimpleResponse;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.Position;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "meetingList", ignore = true)
    @Mapping(target = "agendaItemList", ignore = true)
    @Mapping(target = "minutesList", ignore = true)
    @Mapping(target = "documentList", ignore = true)
    @Mapping(target = "documentVersionList", ignore = true)
    @Mapping(target = "motionList", ignore = true)
    @Mapping(target = "voteSessionList", ignore = true)
    @Mapping(target = "docTemplateList", ignore = true)
    @Mapping(target = "generatedDocumentList", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "meetingParticipantList", ignore = true)
    @Mapping(target = "meetingInvitationByInviteeUser", ignore = true)
    @Mapping(target = "meetingInvitationByInvitedBy", ignore = true)
    @Mapping(target = "attendanceLogByUser", ignore = true)
    @Mapping(target = "attendanceLogByRecordedBy", ignore = true)
    @Mapping(target = "speakerQueueList", ignore = true)
    @Mapping(target = "speakerTurnByUser", ignore = true)
    @Mapping(target = "speakerTurnByCreatedBy", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    @Mapping(target = "aclEntryList", ignore = true)
    @Mapping(target = "documentAccessLogList", ignore = true)
    @Mapping(target = "approvalRequestList", ignore = true)
    @Mapping(target = "approvalStepList", ignore = true)
    @Mapping(target = "voteEligibilityList", ignore = true)
    @Mapping(target = "voteBallotList", ignore = true)
    @Mapping(target = "voteResultList", ignore = true)
    @Mapping(target = "auditLogList", ignore = true)
    @Mapping(target = "notificationList", ignore = true)
    @Mapping(target = "role", ignore = true)
    User toEntity(UserCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "meetingList", ignore = true)
    @Mapping(target = "agendaItemList", ignore = true)
    @Mapping(target = "minutesList", ignore = true)
    @Mapping(target = "documentList", ignore = true)
    @Mapping(target = "documentVersionList", ignore = true)
    @Mapping(target = "motionList", ignore = true)
    @Mapping(target = "voteSessionList", ignore = true)
    @Mapping(target = "docTemplateList", ignore = true)
    @Mapping(target = "generatedDocumentList", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "meetingParticipantList", ignore = true)
    @Mapping(target = "meetingInvitationByInviteeUser", ignore = true)
    @Mapping(target = "meetingInvitationByInvitedBy", ignore = true)
    @Mapping(target = "attendanceLogByUser", ignore = true)
    @Mapping(target = "attendanceLogByRecordedBy", ignore = true)
    @Mapping(target = "speakerQueueList", ignore = true)
    @Mapping(target = "speakerTurnByUser", ignore = true)
    @Mapping(target = "speakerTurnByCreatedBy", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    @Mapping(target = "aclEntryList", ignore = true)
    @Mapping(target = "documentAccessLogList", ignore = true)
    @Mapping(target = "approvalRequestList", ignore = true)
    @Mapping(target = "approvalStepList", ignore = true)
    @Mapping(target = "voteEligibilityList", ignore = true)
    @Mapping(target = "voteBallotList", ignore = true)
    @Mapping(target = "voteResultList", ignore = true)
    @Mapping(target = "auditLogList", ignore = true)
    @Mapping(target = "notificationList", ignore = true)
    @Mapping(target = "role", ignore = true)
    void updateEntity(UserUpdateRequest request, @MappingTarget User user);

    @Mapping(target = "positionId", expression = "java(user.getPosition() != null ? user.getPosition().getId() : null)")
    @Mapping(target = "positionName", expression = "java(user.getPosition() != null ? user.getPosition().getPositionName() : null)")
    @Mapping(target = "positionCode", expression = "java(user.getPosition() != null ? user.getPosition().getPositionCode() : null)")
    @Mapping(target = "department", expression = "java(toDepartmentSimpleResponse(user.getDepartment()))")
    @Mapping(target = "role", expression = "java(toRoleSimpleResponse(user.getRole()))")
    @Mapping(target = "position", expression = "java(toPositionResponse(user.getPosition()))")
    UserResponse toResponse(User user);

    default DepartmentSimpleResponse toDepartmentSimpleResponse(Department department) {
        if (department == null) {
            return null;
        }

        return DepartmentSimpleResponse.builder()
                .id(department.getId())
                .deptName(department.getDeptName())
                .code(department.getCode())
                .status(department.getStatus())
                .parentDepartmentId(
                        department.getParentDepartment() != null ? department.getParentDepartment().getId() : null)
                .build();
    }

    default RoleSimpleResponse toRoleSimpleResponse(Role role) {
        if (role == null) {
            return null;
        }

        return RoleSimpleResponse.builder()
                .id(role.getId())
                .roleName(role.getRoleName())
                .build();
    }

    default PositionResponse toPositionResponse(Position position) {
        if (position == null) {
            return null;
        }

        return PositionResponse.builder()
                .id(position.getId())
                .positionName(position.getPositionName())
                .positionCode(position.getPositionCode())
                .rankOrder(position.getRankOrder())
                .isLeadership(position.getIsLeadership())
                .description(position.getDescription())
                .departmentId(position.getDepartment() != null ? position.getDepartment().getId() : null)
                .departmentName(position.getDepartment() != null ? position.getDepartment().getDeptName() : null)
                .createdAt(position.getCreatedAt())
                .updatedAt(position.getUpdatedAt())
                .build();
    }

}
