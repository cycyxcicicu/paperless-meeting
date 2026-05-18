package vn.acme.paperless_meeting.specification.location;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import vn.acme.paperless_meeting.entity.Location;


public class LocationSpecification {
    public static Specification<Location> build(String keyword, Boolean isActive, List<UUID> allowedDepartmentIds, boolean includeShared) {
        return (root, query, cb) -> {
            // avoid fetch joins in count query; we don't fetch collections here
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), kw),
                        cb.like(cb.lower(root.get("roomCode")), kw),
                        cb.like(cb.lower(root.get("address")), kw)));
            }

            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            if (allowedDepartmentIds != null && !allowedDepartmentIds.isEmpty()) {
                if (includeShared) {
                    predicates.add(cb.or(
                            root.get("department").isNull(),
                            root.get("department").get("id").in(allowedDepartmentIds)
                    ));
                } else {
                    predicates.add(root.get("department").get("id").in(allowedDepartmentIds));
                }
            } else if (allowedDepartmentIds != null && allowedDepartmentIds.isEmpty()) {
                 // Không có phòng ban nào được phép -> nếu có includeShared thì chỉ thấy phòng Shared
                 if (includeShared) {
                     predicates.add(root.get("department").isNull());
                 } else {
                     // Force false predicate
                     predicates.add(cb.disjunction());
                 }
            } else {
                // allowedDepartmentIds == null (SUPER_ADMIN no filter)
                // Do not add department predicate, sees everything
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
