package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.Position;

public interface PositionRepository extends JpaRepository<Position, UUID> {

    // Tìm tất cả vị trí theo id phòng ban
    List<Position> findByDepartmentId(UUID departmentId);

    // Tìm các vị trí dùng chung (không thuộc phòng ban nào)
    List<Position> findByDepartmentIsNull();

    // Tìm các vị trí dùng chung VÀ các vị trí thuộc danh sách phòng ban
    List<Position> findByDepartmentIsNullAndIsDeletedFalseOrDepartmentIdInAndIsDeletedFalse(List<UUID> departmentIds);

    @Query("SELECT p FROM Position p WHERE (p.department IS NULL OR p.department.id IN :departmentIds) ORDER BY p.department.id NULLS FIRST, p.rankOrder ASC, p.positionName ASC")
    List<Position> findSystemAndAllowedPositions(@Param("departmentIds") List<UUID> departmentIds);


    // Kiểm tra trùng mã vị trí trong phòng ban
    boolean existsByPositionCodeAndDepartmentId(String positionCode, UUID departmentId);
    boolean existsByPositionCodeAndDepartmentIsNull(String positionCode);

    boolean existsByPositionCodeAndDepartmentIdAndIdNot(String positionCode, UUID departmentId, UUID id);
    boolean existsByPositionCodeAndDepartmentIsNullAndIdNot(String positionCode, UUID id);

    boolean existsByPositionNameAndDepartmentId(String positionName, UUID departmentId);
    boolean existsByPositionNameAndDepartmentIsNull(String positionName);

    boolean existsByPositionNameAndDepartmentIdAndIdNot(String positionName, UUID departmentId, UUID id);
    boolean existsByPositionNameAndDepartmentIsNullAndIdNot(String positionName, UUID id);

    // Tìm các vị trí theo id phòng ban và sắp xếp kết quả
    @Query("""
            SELECT p FROM Position p
            WHERE p.department.id = :departmentId
            ORDER BY p.rankOrder ASC, p.positionName ASC
            """)
    List<Position> findByDepartmentIdOrdered(@Param("departmentId") UUID departmentId);

    // Tìm tất cả vị trí theo danh sách id phòng ban
    List<Position> findByDepartmentIdIn(List<UUID> departmentIds);

    // Tìm vị trí theo mã
    Optional<Position> findByPositionCode(String positionCode);
}
