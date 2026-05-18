package vn.acme.paperless_meeting.mapper.motion;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.acme.paperless_meeting.dto.request.motion.MotionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.motion.MotionResponse;
import vn.acme.paperless_meeting.entity.Motion;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface MotionMapper {
    @Mapping(target = "agendaItem", ignore = true)
    @Mapping(target = "meeting", ignore = true)
    Motion toEntity(MotionUpsertRequest request);

    @Mapping(target = "agendaItem", ignore = true)
    @Mapping(target = "meeting", ignore = true)
    void updateEntity(MotionUpsertRequest request, @MappingTarget Motion motion);

    @Mapping(target = "agendaItemId", source = "agendaItem.id")
    @Mapping(target = "meetingId", source = "meeting.id")
    @Mapping(target = "createdByUserId", source = "createdBy.id")
    @Mapping(target = "createdByFullName", source = "createdBy.fullName")
    MotionResponse toResponse(Motion motion);
}
