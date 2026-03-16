package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.Department;

import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
	boolean existsByDeptNameAndParentDepartment_Id(String deptName, UUID parentDepartmentId);

	boolean existsByDeptNameAndParentDepartmentIsNull(String deptName);

	boolean existsByDeptNameAndParentDepartment_IdAndIdNot(String deptName, UUID parentDepartmentId, UUID id);

	boolean existsByDeptNameAndParentDepartmentIsNullAndIdNot(String deptName, UUID id);
}
