package vn.acme.paperless_meeting.dto.request.department;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;

@Getter
@Setter
public class DepartmentUpsertRequest {
    @NotBlank(message = "DEPARTMENT_NAME_REQUIRED")
    @Size(min = 3, max = 100, message = "NAME_INVALID")
    private String deptName;

    @NotBlank(message = "DEPARTMENT_CODE_REQUIRED")
    @Size(min = 1, max = 50, message = "CODE_INVALID")
    private String code;

    @NotNull(message = "DEPARTMENT_STATUS_REQUIRED")
    private DepartmentStatus status;

    private LocalDate establishedDate;

    @Size(max = 20, message = "PHONE_INVALID")
    private String phoneNumber;

    @Size(max = 100, message = "EMAIL_INVALID")
    private String email;

    @Size(max = 255, message = "ADDRESS_INVALID")
    private String headquartersAddress;

    private UUID parentDepartmentId;
}
