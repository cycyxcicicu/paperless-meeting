package vn.acme.paperless_meeting.mapper.document;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.acme.paperless_meeting.dto.response.document.DocumentResponse;
import vn.acme.paperless_meeting.dto.response.document.DocumentVersionResponse;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.DocumentVersion;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface DocumentMapper {

    @Mapping(source = "createdBy.fullName", target = "createdByName")
    @Mapping(source = "currentVersion", target = "currentVersion")
    DocumentResponse toResponse(Document document);

    DocumentVersionResponse toVersionResponse(DocumentVersion version);
}
