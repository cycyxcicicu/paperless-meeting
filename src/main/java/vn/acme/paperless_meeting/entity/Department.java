package vn.acme.paperless_meeting.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE departments SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "departments", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "parent_dept_id", "dept_name",
                                "is_deleted" }, name = "uk_dept_parent_name")
}, indexes = {
                @Index(columnList = "parent_dept_id", name = "idx_dept_parent"),
                @Index(columnList = "is_deleted", name = "idx_dept_is_deleted")
})
@SQLRestriction("is_deleted = false")
public class Department extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private String deptName;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "parent_dept_id")
        private Department parentDepartment;

        @OneToMany(mappedBy = "parentDepartment")
        private List<Department> departmentList = new ArrayList<>();

        @OneToMany(mappedBy = "department")
        private List<Meeting> meetingList = new ArrayList<>();

        @OneToMany(mappedBy = "ownerDepartment")
        private List<Document> documentList = new ArrayList<>();

        @OneToMany(mappedBy = "ownerDepartment")
        private List<DocTemplate> docTemplateList = new ArrayList<>();

        @OneToMany(mappedBy = "department")
        private List<UserDepartment> userDepartmentList = new ArrayList<>();

        @OneToMany(mappedBy = "department")
        private List<Scope> scopeList = new ArrayList<>();

        @OneToMany(mappedBy = "department")
        private List<AclPrincipal> aclPrincipalList = new ArrayList<>();
}
