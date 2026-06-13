package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
        long countByRoleIsNull();

        @Query("SELECT COUNT(u) FROM User u WHERE u.position IS NOT NULL")
        long countUsersWithPosition();

        @Query("SELECT COUNT(u) FROM User u WHERE u.position IS NOT NULL AND u.department.id IN :departmentIds")
        long countUsersWithPositionInDepartments(@Param("departmentIds") List<UUID> departmentIds);

        @EntityGraph(attributePaths = { "position", "department", "role" })
        List<User> findAll();

        @EntityGraph(attributePaths = { "position", "department", "role" })
        Optional<User> findById(UUID id);

        boolean existsByUsername(String username);

        boolean existsByUsernameAndIdNot(String username, UUID id);

        boolean existsByRole_Id(UUID roleId);

        boolean existsByPosition_Id(UUID positionId);

        boolean existsByEmail(String email);

        // câu sql của cái này là SELECT COUNT(*) > 0 FROM user WHERE email = ? AND id
        // != ?
        boolean existsByEmailAndIdNot(String email, UUID id);

        boolean existsByPhone(String phone);

        boolean existsByPhoneAndIdNot(String phone, UUID id);

        @EntityGraph(attributePaths = { "position", "department", "role" })
        Optional<User> findByUsernameAndStatus(String username, UserStatus status);

        @EntityGraph(attributePaths = { "position", "department", "role" })
        List<User> findByIdIn(List<UUID> ids);

        // Load only role (no permissions) when finding user by username for auth fast
        // path
        @EntityGraph(attributePaths = { "position", "department", "role" })
        Optional<User> findWithRoleByUsernameAndStatus(String username, UserStatus status);

        // Load role + permissions (eager) khi xác thực để tránh N+1
        @EntityGraph(attributePaths = { "position", "department", "role", "role.rolePermissionSet",
                        "role.rolePermissionSet.permission" })
        Optional<User> findWithAuthoritiesByUsernameAndStatus(String username, UserStatus status);

        boolean existsByDepartmentIdAndRole_RoleName(UUID departmentId, String roleName);

        boolean existsByDepartmentIdAndRole_RoleNameAndIdNot(UUID departmentId, String roleName, UUID id);

        boolean existsByDepartmentIdAndRole_RoleCode(UUID departmentId, String roleCode);

        boolean existsByDepartmentIdAndRole_RoleCodeAndIdNot(UUID departmentId, String roleCode, UUID id);

        boolean existsByDepartmentIdIn(List<UUID> departmentIds);

        long countByDepartmentIdIn(List<UUID> departmentIds);

        long countByStatus(UserStatus status);

        long countByStatusAndDepartmentIdIn(UserStatus status, List<UUID> departmentIds);

        long countByRole_RoleName(String roleName);

        long countByRole_RoleNameAndStatus(String roleName, UserStatus status);

        long countByRole_RoleCode(String roleCode);

        long countByRole_RoleCodeAndStatus(String roleCode, UserStatus status);

        @Query("SELECT u FROM User u WHERE u.department.id = :deptId AND u.position IS NOT NULL AND (u.position.positionCode = 'CHU_TICH' OR u.position.positionCode = 'GIAM_DOC') AND u.status = vn.acme.paperless_meeting.entity.enums.UserStatus.ACTIVE")
        List<User> findActiveLeadersByDepartmentId(@Param("deptId") UUID deptId);
}
