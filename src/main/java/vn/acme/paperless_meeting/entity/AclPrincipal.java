package vn.acme.paperless_meeting.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import vn.acme.paperless_meeting.entity.enums.AclPrincipalType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity

@Table(name = "acl_principals", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "user_id" }, name = "uk_aclprincipal_user"),
                @UniqueConstraint(columnNames = { "role_id" }, name = "uk_aclprincipal_role"),
                @UniqueConstraint(columnNames = { "dept_id" }, name = "uk_aclprincipal_dept")
}, indexes = {
                @Index(columnList = "principal_type", name = "idx_aclprincipal_type")
})

// AclPrincipal đại diện cho một chủ thể (principal) trong hệ thống ACL,
// có thể là người dùng, vai trò hoặc phòng ban,
// và liên kết với các quyền truy cập thông qua AclEntry.
public class AclPrincipal {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Enumerated(EnumType.STRING)
        @Column(name = "principal_type")
        private AclPrincipalType principalType;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id")
        private User user;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "role_id")
        private Role role;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "dept_id")
        private Department department;

        @OneToMany(mappedBy = "principal", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<AclEntry> aclEntryList = new ArrayList<>();
}
