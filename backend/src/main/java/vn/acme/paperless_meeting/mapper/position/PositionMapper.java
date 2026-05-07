package vn.acme.paperless_meeting.mapper.position;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.position.PositionUpsertRequest;
import vn.acme.paperless_meeting.dto.response.position.PositionResponse;
import vn.acme.paperless_meeting.entity.Position;

@Mapper(componentModel = "spring")
public interface PositionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Position toEntity(PositionUpsertRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(PositionUpsertRequest request, @MappingTarget Position position);

    @Mapping(target = "departmentId", ignore = true)
    @Mapping(target = "departmentName", ignore = true)
    PositionResponse toResponse(Position position);

    /**
     * Convert Position entity to PositionResponse, handling department name
     * resolution
     */
    default PositionResponse toResponseWithDepartment(Position position) {
        if (position == null) {
            return null;
        }

        // Build response with all fields
        PositionResponse.PositionResponseBuilder builder = PositionResponse.builder()
                .id(position.getId())
                .positionName(position.getPositionName())
                .positionCode(position.getPositionCode())
                .rankOrder(position.getRankOrder())
                .isLeadership(position.getIsLeadership())
                .description(position.getDescription())
                .createdAt(position.getCreatedAt())
                .updatedAt(position.getUpdatedAt());

        // Add department info if available
        if (position.getDepartment() != null) {
            builder.departmentId(position.getDepartment().getId())
                    .departmentName(position.getDepartment().getDeptName());
        }

        return builder.build();
    }
}
