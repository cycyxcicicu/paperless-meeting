package vn.acme.paperless_meeting.dto.request.department;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentUpsertRequest {
    @NotBlank(message = "DEPARTMENT_NAME_REQUIRED")
    @Size(min = 3, max = 100, message = "NAME_INVALID")
    private String deptName;

    private UUID parentDepartmentId;
}
