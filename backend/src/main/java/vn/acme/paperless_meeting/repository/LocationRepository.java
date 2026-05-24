package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import vn.acme.paperless_meeting.entity.Location;

import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.dto.response.location.LocationStatsResponse;

import java.util.List;
import java.util.UUID;

public interface LocationRepository extends JpaRepository<Location, UUID>, JpaSpecificationExecutor<Location> {
    
    @Query("SELECT new vn.acme.paperless_meeting.dto.response.location.LocationStatsResponse(" +
           "COUNT(l), " +
           "SUM(CASE WHEN l.isActive = true THEN 1L ELSE 0L END), " +
           "COALESCE(SUM(l.capacity), 0L)) " +
           "FROM Location l " +
           "WHERE (:allowedDepartmentIds IS NULL OR l.department.id IN :allowedDepartmentIds) " +
           "OR (:includeShared = true AND l.department IS NULL)")
    LocationStatsResponse getStats(
            @Param("allowedDepartmentIds") List<UUID> allowedDepartmentIds,
            @Param("includeShared") boolean includeShared);
}
