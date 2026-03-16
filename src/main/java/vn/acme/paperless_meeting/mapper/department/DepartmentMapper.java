package vn.acme.paperless_meeting.mapper.department;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.entity.Department;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "parentDepartment", ignore = true)
    @Mapping(target = "departmentList", ignore = true)
    @Mapping(target = "meetingList", ignore = true)
    @Mapping(target = "documentList", ignore = true)
    @Mapping(target = "docTemplateList", ignore = true)
    @Mapping(target = "userDepartmentList", ignore = true)
    @Mapping(target = "scopeList", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    Department toEntity(DepartmentUpsertRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "parentDepartment", ignore = true)
    @Mapping(target = "departmentList", ignore = true)
    @Mapping(target = "meetingList", ignore = true)
    @Mapping(target = "documentList", ignore = true)
    @Mapping(target = "docTemplateList", ignore = true)
    @Mapping(target = "userDepartmentList", ignore = true)
    @Mapping(target = "scopeList", ignore = true)
    @Mapping(target = "aclPrincipalList", ignore = true)
    void updateEntity(DepartmentUpsertRequest request, @MappingTarget Department department);

    @Mapping(target = "parentDepartmentId", source = "parentDepartment.id")
    DepartmentResponse toResponse(Department department);
}
