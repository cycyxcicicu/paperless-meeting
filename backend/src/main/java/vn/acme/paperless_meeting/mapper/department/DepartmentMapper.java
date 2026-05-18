package vn.acme.paperless_meeting.mapper.department;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.entity.Department;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface DepartmentMapper {
    Department toEntity(DepartmentUpsertRequest request);

    void updateEntity(DepartmentUpsertRequest request, @MappingTarget Department department);

    @Mapping(target = "parentDepartmentId", source = "parentDepartment.id")
    DepartmentResponse toResponse(Department department);
}
