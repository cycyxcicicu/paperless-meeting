package vn.acme.paperless_meeting.dto.request.position;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PositionUpsertRequest {

    @NotBlank(message = "POSITION_NAME_REQUIRED")
    @Size(min = 2, max = 100, message = "NAME_INVALID")
    private String positionName;

    @NotBlank(message = "POSITION_CODE_REQUIRED")
    @Size(min = 1, max = 50, message = "CODE_INVALID")
    private String positionCode;

    @NotNull(message = "RANK_ORDER_REQUIRED")
    private Integer rankOrder;

    private Boolean isLeadership;

    @Size(max = 500, message = "DESCRIPTION_INVALID")
    private String description;

}
