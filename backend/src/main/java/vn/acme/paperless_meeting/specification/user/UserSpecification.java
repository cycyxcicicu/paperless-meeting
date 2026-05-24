package vn.acme.paperless_meeting.specification.user;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import vn.acme.paperless_meeting.entity.Role;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.RoleName;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

public class UserSpecification {

    /**
     * Build Specification lọc người dùng.
     *
     * @param keyword       tìm kiếm theo username / fullName / email / phone
     * @param status        lọc theo trạng thái
     * @param roleName      lọc theo vai trò (null = không lọc)
     * @param departmentIds giới hạn theo danh sách đơn vị
     */
    public static Specification<User> build(String keyword, UserStatus status,
            RoleName roleName, List<UUID> departmentIds) {
        return (root, query, cb) -> {
            // Tránh fetch join trong count query
            if (!Long.class.equals(query.getResultType())) {
                root.fetch("position", JoinType.LEFT);
            }
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            // Lọc theo từ khóa
            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("username")), kw),
                        cb.like(cb.lower(root.get("fullName")), kw),
                        cb.like(cb.lower(root.get("email")), kw),
                        cb.like(cb.lower(root.get("phone")), kw)));
            }

            // Lọc theo trạng thái
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Lọc theo đơn vị
            if (departmentIds != null && !departmentIds.isEmpty()) {
                if (departmentIds.size() == 1) {
                    predicates.add(cb.equal(root.get("department").get("id"), departmentIds.get(0)));
                } else {
                    predicates.add(root.get("department").get("id").in(departmentIds));
                }
            }

            // Lọc theo vai trò — JOIN trực tiếp vào bảng roles theo roleCode
            if (roleName != null) {
                Join<User, Role> roleJoin = root.join("role", JoinType.INNER);
                predicates.add(cb.equal(roleJoin.get("roleCode"), roleName.name()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
