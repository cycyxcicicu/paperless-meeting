package vn.acme.paperless_meeting.dto.response.department;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;

@Getter
@Builder
public class DepartmentSimpleResponse {
    private UUID id;
    private String deptName;
    private String code;
    private DepartmentStatus status;
    private UUID parentDepartmentId;
}
