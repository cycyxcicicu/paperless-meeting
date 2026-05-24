package vn.acme.paperless_meeting.dto.response.department;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentChildResponse {
    private UUID id;
    private String deptName;
    private String code;
    private String headquartersAddress;
    private String phoneNumber;
    private Long totalMembers;
    private DepartmentStatus status;
}
