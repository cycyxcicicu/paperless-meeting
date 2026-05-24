package vn.acme.paperless_meeting.mapper.position;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import vn.acme.paperless_meeting.dto.request.position.PositionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.entity.Position;

@Mapper(componentModel = "spring", unmappedTargetPolicy =ReportingPolicy.IGNORE)
public interface PositionMapper {

    Position toEntity(PositionUpsertRequest request);

    void updateEntity(PositionUpsertRequest request, @MappingTarget Position position);

    PositionResponse toResponse(Position position);

    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.deptName")
    PositionResponse toResponseWithDepartment(Position position);
}
