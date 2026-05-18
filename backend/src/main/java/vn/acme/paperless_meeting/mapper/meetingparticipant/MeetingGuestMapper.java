package vn.acme.paperless_meeting.mapper.meetingparticipant;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.meetingparticipant.AddGuestRequest;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.GuestResponse;
import vn.acme.paperless_meeting.dto.response.meetingparticipant.AttendeeResponse;
import vn.acme.paperless_meeting.entity.MeetingGuest;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface MeetingGuestMapper {

    MeetingGuest toEntity(AddGuestRequest request);

    void updateEntity(AddGuestRequest request, @MappingTarget MeetingGuest guest);

    @Mapping(target = "guestId", source = "id")
    @Mapping(target = "meetingId", source = "meeting.id")
    GuestResponse toResponse(MeetingGuest guest);

    @Mapping(target = "type", constant = "EXTERNAL")
    @Mapping(target = "guestId", source = "id")
    @Mapping(target = "role", constant = "GUEST")
    AttendeeResponse toAttendeeResponse(MeetingGuest guest);
}
