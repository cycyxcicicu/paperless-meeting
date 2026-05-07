package vn.acme.paperless_meeting.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
        @EntityGraph(attributePaths = { "position", "department", "role" })
        List<User> findAll();

        @EntityGraph(attributePaths = { "position", "department", "role" })
        Optional<User> findById(UUID id);

        boolean existsByUsername(String username);

        boolean existsByUsernameAndIdNot(String username, UUID id);

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

        // Load only role (no permissions) when finding user by username for auth fast path
        @EntityGraph(attributePaths = { "position", "department", "role" })
        Optional<User> findWithRoleByUsernameAndStatus(String username, UserStatus status);

        // Load role + permissions (eager) khi xác thực để tránh N+1
        @EntityGraph(attributePaths = { "position", "department", "role", "role.rolePermissionSet", "role.rolePermissionSet.permission" })
        Optional<User> findWithAuthoritiesByUsernameAndStatus(String username, UserStatus status);
}
