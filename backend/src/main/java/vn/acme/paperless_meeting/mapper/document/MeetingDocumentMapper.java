package vn.acme.paperless_meeting.mapper.document;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.acme.paperless_meeting.dto.response.document.MeetingDocumentResponse;
import vn.acme.paperless_meeting.entity.MeetingDocument;

@Mapper(componentModel = "spring",
        uses = DocumentMapper.class,
        unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface MeetingDocumentMapper {

    @Mapping(source = "document", target = "document")
    @Mapping(source = "agendaItem.id", target = "agendaItemId")
    @Mapping(source = "agendaItem.title", target = "agendaItemTitle")
    MeetingDocumentResponse toResponse(MeetingDocument meetingDocument);
}
