package vn.acme.paperless_meeting.dto.response.role;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoleSimpleResponse {
    private UUID id;
    private String roleName;
}