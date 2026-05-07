package vn.acme.paperless_meeting.mapper.location;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.location.LocationUpsertRequest;
import vn.acme.paperless_meeting.dto.response.location.LocationResponse;
import vn.acme.paperless_meeting.entity.Location;

@Mapper(componentModel = "spring")
public interface LocationMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "meetingList", ignore = true)
    Location toEntity(LocationUpsertRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "meetingList", ignore = true)
    void updateEntity(LocationUpsertRequest request, @MappingTarget Location location);

    LocationResponse toResponse(Location location);
}
