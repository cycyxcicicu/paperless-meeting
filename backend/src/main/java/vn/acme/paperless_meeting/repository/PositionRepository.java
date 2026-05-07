package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.Position;

public interface PositionRepository extends JpaRepository<Position, UUID> {

    /**
     * Tìm tất cả vị trí theo id phòng ban
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ tự động bị loại trừ
     * bởi @SQLRestriction trên entity Position
     */
    List<Position> findByDepartmentId(UUID departmentId);

    /**
     * Kiểm tra xem mã vị trí có tồn tại trong phòng ban hay không
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ được loại trừ tự động
     * bởi @SQLRestriction
     */
    boolean existsByPositionCodeAndDepartmentId(String positionCode, UUID departmentId);

    /**
     * Kiểm tra xem mã vị trí có tồn tại trong phòng ban, ngoại trừ một vị trí cụ
     * thể
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ được loại trừ tự động
     * bởi @SQLRestriction
     */
    boolean existsByPositionCodeAndDepartmentIdAndIdNot(String positionCode, UUID departmentId, UUID id);

    /**
     * Kiểm tra xem tên vị trí có tồn tại trong phòng ban hay không
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ được loại trừ tự động
     * bởi @SQLRestriction
     */
    boolean existsByPositionNameAndDepartmentId(String positionName, UUID departmentId);

    /**
     * Kiểm tra xem tên vị trí có tồn tại trong phòng ban, ngoại trừ một vị trí cụ
     * thể
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ được loại trừ tự động
     * bởi @SQLRestriction
     */
    boolean existsByPositionNameAndDepartmentIdAndIdNot(String positionName, UUID departmentId, UUID id);

    /**
     * Tìm các vị trí theo id phòng ban và sắp xếp kết quả
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ được loại trừ tự động
     * bởi @SQLRestriction
     */
    @Query("""
            SELECT p FROM Position p
            WHERE p.department.id = :departmentId
            ORDER BY p.rankOrder ASC, p.positionName ASC
            """)
    List<Position> findByDepartmentIdOrdered(@Param("departmentId") UUID departmentId);

    /**
     * Tìm tất cả vị trí theo danh sách id phòng ban
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ được loại trừ tự động
     * bởi @SQLRestriction
     */
    List<Position> findByDepartmentIdIn(List<UUID> departmentIds);

    /**
     * Tìm vị trí theo mã
     * Lưu ý: các bản ghi bị xóa mềm (soft-deleted) sẽ được loại trừ tự động
     * bởi @SQLRestriction
     */
    Optional<Position> findByPositionCode(String positionCode);
}
