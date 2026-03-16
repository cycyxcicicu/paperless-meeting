package vn.acme.paperless_meeting.dto.response.department;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DepartmentResponse {
    private UUID id;
    private String deptName;
    private UUID parentDepartmentId;
}
