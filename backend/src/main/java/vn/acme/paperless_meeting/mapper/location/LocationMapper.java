package vn.acme.paperless_meeting.mapper.location;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.location.LocationUpsertRequest;
import vn.acme.paperless_meeting.dto.response.location.LocationResponse;
import vn.acme.paperless_meeting.entity.Location;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface LocationMapper {
    Location toEntity(LocationUpsertRequest request);

    void updateEntity(LocationUpsertRequest request, @MappingTarget Location location);

    LocationResponse toResponse(Location location);
}
