package vn.acme.paperless_meeting.specification.department;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import vn.acme.paperless_meeting.entity.Department;

public class DepartmentSpecification {

    public static Specification<Department> build(String keyword, UUID parentId) {
        return (root, query, cb) -> {
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("deptName")), kw),
                        cb.like(cb.lower(root.get("description")), kw)));
            }

            if (parentId != null) {
                predicates.add(cb.equal(root.get("parentDepartment").get("id"), parentId));
            } else {
                predicates.add(root.get("parentDepartment").isNull());
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
