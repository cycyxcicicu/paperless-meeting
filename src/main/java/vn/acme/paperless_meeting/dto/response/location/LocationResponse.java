package vn.acme.paperless_meeting.dto.response.location;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import vn.acme.paperless_meeting.entity.enums.LocationType;

@Getter
@Builder
public class LocationResponse {
    private UUID id;
    private String name;
    private String address;
    private String roomCode;
    private String onlineLink;
    private LocationType type;
}
