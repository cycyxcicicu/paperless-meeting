package vn.acme.paperless_meeting.dto.response.position;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PositionResponse {
    private UUID id;
    private String positionName;
    private String positionCode;
    private Integer rankOrder;
    private Boolean isLeadership;
    private String description;
    private UUID departmentId;
    private String departmentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
