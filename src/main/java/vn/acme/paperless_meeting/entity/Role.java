package vn.acme.paperless_meeting.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@SQLDelete(sql = "UPDATE roles SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@SQLRestriction("is_deleted = false")
@Table(name = "roles", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "role_name", "is_deleted" }, name = "uk_role_name")
})

public class Role extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private String roleName;

        @OneToMany(mappedBy = "role")
        private List<RolePermission> rolePermissionList = new ArrayList<>();

        @OneToMany(mappedBy = "role")
        private List<UserRoleScope> userRoleScopeList = new ArrayList<>();

        @OneToMany(mappedBy = "role")
        private List<AclPrincipal> aclPrincipalList = new ArrayList<>();

        @OneToMany(mappedBy = "approverRole")
        private List<ApprovalStep> approvalStepList = new ArrayList<>();
}
