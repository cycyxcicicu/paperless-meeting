package vn.acme.paperless_meeting.service.location;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.location.LocationUpsertRequest;
import vn.acme.paperless_meeting.dto.response.location.LocationResponse;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.location.LocationMapper;
import vn.acme.paperless_meeting.repository.LocationRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LocationService {
    LocationRepository locationRepository;
    LocationMapper locationMapper;

    public List<LocationResponse> findAll() {
        return locationRepository.findAll().stream()
                .map(locationMapper::toResponse)
                .toList();
    }

    public LocationResponse findById(UUID id) {
        return locationMapper.toResponse(getLocation(id));
    }

    public LocationResponse create(LocationUpsertRequest request) {
        Location location = locationMapper.toEntity(request);
        return locationMapper.toResponse(locationRepository.save(location));
    }

    public LocationResponse update(UUID id, LocationUpsertRequest request) {
        Location location = getLocation(id);
        locationMapper.updateEntity(request, location);
        return locationMapper.toResponse(locationRepository.save(location));
    }

    public void delete(UUID id) {
        Location location = getLocation(id);
        locationRepository.delete(location);
    }

    private Location getLocation(UUID id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_EXIST));
    }
}
