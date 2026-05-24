package vn.acme.paperless_meeting.dto.response.department;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class DepartmentTreeResponse {
    private UUID id;
    private String deptName;
    private String code;
    private UUID parentDepartmentId;
    
    @Builder.Default
    private List<DepartmentTreeResponse> children = new ArrayList<>();
}
