package vn.acme.paperless_meeting.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.acme.paperless_meeting.entity.UserDepartment;

import java.util.UUID;

public interface UserDepartmentRepository extends JpaRepository<UserDepartment, UUID> {
}
