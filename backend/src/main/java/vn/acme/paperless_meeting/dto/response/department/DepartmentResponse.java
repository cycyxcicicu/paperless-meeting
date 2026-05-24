package vn.acme.paperless_meeting.dto.response.department;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;

@Getter
@Builder
public class DepartmentResponse {
    private UUID id;
    private String deptName;
    private String code;
    private LocalDate establishedDate;
    private DepartmentStatus status;
    private String phoneNumber;
    private String email;
    private String headquartersAddress;
    private String description;
    private String director;
    
    @Builder.Default
    private Integer totalMembers = 0;
    
    @Builder.Default
    private Integer totalChildUnits = 0;

    private UUID parentDepartmentId;

    @Builder.Default
    private List<DepartmentResponse> children = new ArrayList<>();
}
