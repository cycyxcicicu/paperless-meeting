package vn.acme.paperless_meeting.dto.response.location;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;


@Getter
@Builder
public class LocationResponse {
    private UUID id;
    private String name;
    private String address;
    private String roomCode;
    private Boolean isActive;
    private Integer capacity;
}
