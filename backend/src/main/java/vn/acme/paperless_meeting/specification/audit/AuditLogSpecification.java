package vn.acme.paperless_meeting.specification.audit;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import vn.acme.paperless_meeting.entity.AuditLog;
import vn.acme.paperless_meeting.entity.User;

public class AuditLogSpecification {

    public static Specification<AuditLog> build(String keyword, List<UUID> departmentIds) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Filter by keyword: performer name (username or fullName) or description/metaJson
            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                Join<AuditLog, User> actorJoin = root.join("actorUser", JoinType.LEFT);
                predicates.add(cb.or(
                    cb.like(cb.lower(actorJoin.get("username")), kw),
                    cb.like(cb.lower(actorJoin.get("fullName")), kw),
                    cb.like(cb.lower(root.get("metaJson")), kw)
                ));
            }

            // 2. Filter by department IDs (for role-based scoping of DEPARTMENT_ADMIN)
            if (departmentIds != null && !departmentIds.isEmpty()) {
                Join<AuditLog, User> actorJoin = root.join("actorUser", JoinType.INNER);
                predicates.add(actorJoin.get("department").get("id").in(departmentIds));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
