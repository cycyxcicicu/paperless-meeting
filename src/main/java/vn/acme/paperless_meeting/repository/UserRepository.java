package vn.acme.paperless_meeting.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<User> findByUsernameAndStatus(String username, UserStatus status);


    // Để load luôn authorities khi tìm user để tránh N+1 query
    //entityGraph này sẽ giúp load luôn userRoleScopeByUser và role của user khi tìm kiếm user theo username và status, tránh việc phải truy vấn thêm nhiều lần để lấy role của user
    @EntityGraph(attributePaths = { "userRoleScopeByUser", "userRoleScopeByUser.role" })
    Optional<User> findWithAuthoritiesByUsernameAndStatus(String username, UserStatus status);
}
