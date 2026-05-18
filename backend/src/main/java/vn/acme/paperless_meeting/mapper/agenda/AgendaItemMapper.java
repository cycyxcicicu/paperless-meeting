package vn.acme.paperless_meeting.mapper.agenda;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.acme.paperless_meeting.dto.request.agenda.AgendaItemUpsertRequest;
import vn.acme.paperless_meeting.dto.response.agenda.AgendaItemResponse;
import vn.acme.paperless_meeting.entity.AgendaItem;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface AgendaItemMapper {
    @Mapping(target = "meeting", ignore = true)
    @Mapping(target = "preparedByUser", ignore = true)
    AgendaItem toEntity(AgendaItemUpsertRequest request);

    @Mapping(target = "meeting", ignore = true)
    @Mapping(target = "preparedByUser", ignore = true)
    void updateEntity(AgendaItemUpsertRequest request, @MappingTarget AgendaItem agendaItem);

    @Mapping(target = "preparedByUserId", source = "preparedByUser.id")
    @Mapping(target = "preparedByFullName", source = "preparedByUser.fullName")
    @Mapping(target = "meetingId", source = "meeting.id")
    @Mapping(target = "documents", ignore = true)
    AgendaItemResponse toResponse(AgendaItem agendaItem);
}
