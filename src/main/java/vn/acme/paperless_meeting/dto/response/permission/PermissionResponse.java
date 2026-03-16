package vn.acme.paperless_meeting.dto.response.permission;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PermissionResponse {
    private UUID id;
    private String permCode;
    private String description;
}
