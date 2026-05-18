package vn.acme.paperless_meeting.mapper.meeting;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.meeting.MeetingUpsertRequest;
import vn.acme.paperless_meeting.dto.response.meeting.MeetingResponse;
import vn.acme.paperless_meeting.entity.Meeting;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface MeetingMapper {

    Meeting toEntity(MeetingUpsertRequest request);

    void updateEntity(MeetingUpsertRequest request, @MappingTarget Meeting meeting);

    @Mapping(target = "locationId", source = "location.id")
    @Mapping(target = "locationName", source = "location.name")
    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.deptName")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.fullName")
    @Mapping(target = "approvedById", source = "approvedBy.id")
    @Mapping(target = "approvedByName", source = "approvedBy.fullName")
    MeetingResponse toResponse(Meeting meeting);
}
