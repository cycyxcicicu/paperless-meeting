package vn.acme.paperless_meeting.specification.location;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import vn.acme.paperless_meeting.entity.Location;
import vn.acme.paperless_meeting.entity.enums.LocationType;

public class LocationSpecification {
    public static Specification<Location> build(String keyword, LocationType type, UUID departmentId) {
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

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
