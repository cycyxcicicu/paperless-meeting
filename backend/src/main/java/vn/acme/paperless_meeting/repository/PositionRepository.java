package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.Position;

public interface PositionRepository extends JpaRepository<Position, UUID> {

    long countByDepartmentIsNull();

    @Query("SELECT COUNT(p) FROM Position p WHERE p.department IS NULL OR p.department.id IN :departmentIds")
    long countSystemAndAllowedPositions(@Param("departmentIds") List<UUID> departmentIds);


    // Kiểm tra trùng mã vị trí trong phòng ban
    boolean existsByPositionCodeAndDepartmentId(String positionCode, UUID departmentId);
    boolean existsByPositionCodeAndDepartmentIsNull(String positionCode);

    boolean existsByPositionCodeAndDepartmentIdAndIdNot(String positionCode, UUID departmentId, UUID id);
    boolean existsByPositionCodeAndDepartmentIsNullAndIdNot(String positionCode, UUID id);

    boolean existsByPositionNameAndDepartmentId(String positionName, UUID departmentId);
    boolean existsByPositionNameAndDepartmentIsNull(String positionName);

    boolean existsByPositionNameAndDepartmentIdAndIdNot(String positionName, UUID departmentId, UUID id);
    boolean existsByPositionNameAndDepartmentIsNullAndIdNot(String positionName, UUID id);

    // Tìm vị trí theo mã
    Optional<Position> findByPositionCode(String positionCode);

    @Query("""
            SELECT p FROM Position p
            WHERE (p.department IS NULL OR p.department.id IN :departmentIds)
              AND (:search IS NULL OR :search = '' OR LOWER(p.positionName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.positionCode) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY p.department.id NULLS FIRST, p.rankOrder ASC, p.positionName ASC
            """)
    Page<Position> findSystemAndAllowedPositionsWithSearch(
            @Param("departmentIds") List<UUID> departmentIds,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            SELECT p FROM Position p
            WHERE p.department IS NULL
              AND (:search IS NULL OR :search = '' OR LOWER(p.positionName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.positionCode) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY p.rankOrder ASC, p.positionName ASC
            """)
    Page<Position> findSystemPositionsWithSearch(
            @Param("search") String search, 
            Pageable pageable
    );
}
