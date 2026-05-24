package vn.acme.paperless_meeting.mapper.department;

import java.util.Comparator;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import vn.acme.paperless_meeting.dto.request.department.DepartmentUpsertRequest;
import vn.acme.paperless_meeting.dto.response.department.DepartmentResponse;
import vn.acme.paperless_meeting.dto.response.department.DepartmentChildResponse;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface DepartmentMapper {
    Department toEntity(DepartmentUpsertRequest request);

    void updateEntity(DepartmentUpsertRequest request, @MappingTarget Department department);

    @Mapping(target = "parentDepartmentId", source = "parentDepartment.id")
    @Mapping(target = "totalMembers", expression = "java(department.getUserList() != null ? department.getUserList().size() : 0)")
    @Mapping(target = "totalChildUnits", expression = "java(department.getDepartmentList() != null ? department.getDepartmentList().size() : 0)")
    @Mapping(target = "director", expression = "java(calculateDirectorName(department))")
    DepartmentResponse toResponse(Department department);

    @Mapping(target = "totalMembers", expression = "java(department.getUserList() != null ? (long) department.getUserList().size() : 0L)")
    DepartmentChildResponse toChildResponse(Department department);

    default String calculateDirectorName(Department department) {
        if (department.getUserList() != null) {
            User directorUser = department.getUserList().stream()
                    .filter(u -> u.getPosition() != null && Boolean.TRUE.equals(u.getPosition().getIsLeadership()))
                    .min(Comparator.comparing(u -> {
                        Integer rank = u.getPosition().getRankOrder();
                        return rank != null ? rank : Integer.MAX_VALUE;
                    }))
                    .orElse(null);
            if (directorUser != null) {
                return directorUser.getFullName();
            }
        }
        return null;
    }
}
