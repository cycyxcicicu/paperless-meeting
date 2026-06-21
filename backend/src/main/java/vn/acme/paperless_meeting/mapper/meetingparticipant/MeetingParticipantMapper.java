package vn.acme.paperless_meeting.mapper.meetingparticipant;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddParticipantRequest;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.ParticipantResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeResponse;
import vn.acme.paperless_meeting.entity.MeetingParticipant;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface MeetingParticipantMapper {

    MeetingParticipant toEntity(AddParticipantRequest request);

    void updateEntity(AddParticipantRequest request, @MappingTarget MeetingParticipant participant);

    @Mapping(target = "meetingId", source = "meeting.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "deptName", source = "user.department.deptName")
    @Mapping(target = "positionName", source = "user.position.positionName")
    @Mapping(target = "substituteUserId", source = "substituteUser.id")
    @Mapping(target = "substituteUserFullName", source = "substituteUser.fullName")
    ParticipantResponse toResponse(MeetingParticipant participant);

    @Mapping(target = "type", constant = "INTERNAL")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "phone", source = "user.phone")
    @Mapping(target = "company", source = "user.department.deptName")
    @Mapping(target = "position", source = "user.position.positionName")
    @Mapping(target = "role", source = "participantRole")
    @Mapping(target = "substituteUserId", source = "substituteUser.id")
    @Mapping(target = "substituteUserFullName", source = "substituteUser.fullName")
    AttendeeResponse toAttendeeResponse(MeetingParticipant participant);
}
