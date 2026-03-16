package vn.acme.paperless_meeting.mapper.user;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.request.user.UserUpdateRequest;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
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
    @Mapping(target = "userDepartmentList", ignore = true)
    @Mapping(target = "meetingParticipantList", ignore = true)
    @Mapping(target = "meetingInvitationByInviteeUser", ignore = true)
    @Mapping(target = "meetingInvitationByInvitedBy", ignore = true)
    @Mapping(target = "attendanceLogByUser", ignore = true)
    @Mapping(target = "attendanceLogByRecordedBy", ignore = true)
    @Mapping(target = "speakerQueueList", ignore = true)
    @Mapping(target = "speakerTurnByUser", ignore = true)
    @Mapping(target = "speakerTurnByCreatedBy", ignore = true)
    @Mapping(target = "userRoleScopeByUser", ignore = true)
    @Mapping(target = "userRoleScopeByAssignedBy", ignore = true)
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
    User toEntity(UserCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
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
    @Mapping(target = "userDepartmentList", ignore = true)
    @Mapping(target = "meetingParticipantList", ignore = true)
    @Mapping(target = "meetingInvitationByInviteeUser", ignore = true)
    @Mapping(target = "meetingInvitationByInvitedBy", ignore = true)
    @Mapping(target = "attendanceLogByUser", ignore = true)
    @Mapping(target = "attendanceLogByRecordedBy", ignore = true)
    @Mapping(target = "speakerQueueList", ignore = true)
    @Mapping(target = "speakerTurnByUser", ignore = true)
    @Mapping(target = "speakerTurnByCreatedBy", ignore = true)
    @Mapping(target = "userRoleScopeByUser", ignore = true)
    @Mapping(target = "userRoleScopeByAssignedBy", ignore = true)
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
    void updateEntity(UserUpdateRequest request, @MappingTarget User user);

    UserResponse toResponse(User user);
}
