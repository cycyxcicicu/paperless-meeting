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
import vn.acme.paperless_meeting.entity.enums.UserStatus;

public class UserSpecification {
    public static Specification<User> build(String keyword, UserStatus status, String roleParam, UUID departmentId) {
        return (root, query, cb) -> {
            // avoid fetch joins in count query
            if (!Long.class.equals(query.getResultType())) {
                root.fetch("position", JoinType.LEFT);
            
            }

            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("username")), kw),
                        cb.like(cb.lower(root.get("fullName")), kw),
                        cb.like(cb.lower(root.get("email")), kw),
                        cb.like(cb.lower(root.get("phone")), kw)));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            if (roleParam != null && !roleParam.isBlank()) {
                Join<User, Role> rJoin = root.join("role", JoinType.LEFT);
                try {
                    UUID roleId = UUID.fromString(roleParam);
                    predicates.add(cb.equal(rJoin.get("id"), roleId));
                } catch (IllegalArgumentException ignored) {
                    predicates.add(cb.equal(cb.lower(rJoin.get("roleName")), roleParam.trim().toLowerCase()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
