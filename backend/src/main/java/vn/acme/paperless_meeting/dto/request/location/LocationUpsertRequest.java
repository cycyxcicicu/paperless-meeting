package vn.acme.paperless_meeting.dto.request.location;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class LocationUpsertRequest {
    @NotBlank(message = "LOCATION_NAME_REQUIRED")
    @Size(min = 2, max = 120, message = "NAME_INVALID")
    private String name;

    @Size(max = 255, message = "INVALID_KEY")
    private String address;

    @Size(max = 50, message = "INVALID_KEY")
    private String roomCode;

    private Boolean isActive;

    @Min(value = 1, message = "Sức chứa phải lớn hơn 0")
    private Integer capacity;

    private UUID departmentId;
}
