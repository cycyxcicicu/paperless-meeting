package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.acme.paperless_meeting.entity.Department;
import vn.acme.paperless_meeting.entity.enums.DepartmentStatus;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DepartmentRepository extends JpaRepository<Department, UUID>, JpaSpecificationExecutor<Department> {
	java.util.Optional<Department> findByCode(String code);

	boolean existsByDeptNameAndParentDepartment_Id(String deptName, UUID parentDepartmentId);

	boolean existsByDeptNameAndParentDepartmentIsNull(String deptName);

	boolean existsByDeptNameAndParentDepartment_IdAndIdNot(String deptName, UUID parentDepartmentId, UUID id);

	boolean existsByDeptNameAndParentDepartmentIsNullAndIdNot(String deptName, UUID id);

	@Query("select d.id from Department d where d.parentDepartment.id in :parentIds")
	List<UUID> findIdsByParentDepartmentIdIn(@Param("parentIds") List<UUID> parentIds);

	@Modifying(clearAutomatically = true)
	@Query(value = "UPDATE departments SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = :deletedBy WHERE id IN (:ids) AND is_deleted = false", nativeQuery = true)
	void softDeleteByIds(@Param("ids") List<UUID> ids, @Param("deletedBy") UUID deletedBy);

	Integer countByIdIn(List<UUID> ids);

	List<Department> findByIdIn(List<UUID> ids);

	long countByStatus(DepartmentStatus status);

	long countByParentDepartmentIsNull();
	long countByParentDepartmentIsNullAndStatus(DepartmentStatus status);

	@Query("SELECT COUNT(d) FROM Department d JOIN d.parentDepartment p WHERE p.parentDepartment IS NULL")
	long countLevel2Departments();

	@Query("SELECT COUNT(d) FROM Department d JOIN d.parentDepartment p WHERE p.parentDepartment IS NULL AND d.status = :status")
	long countLevel2DepartmentsByStatus(@Param("status") DepartmentStatus status);
	
	long countByParentDepartment_Id(UUID parentId);
	long countByParentDepartment_IdAndStatus(UUID parentId, DepartmentStatus status);
}
