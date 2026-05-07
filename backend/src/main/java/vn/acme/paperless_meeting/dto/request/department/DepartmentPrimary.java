package vn.acme.paperless_meeting.dto.request.department;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentPrimary {

    private UUID departmentId;

    private Boolean isPrimary;
    
}