package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.AclPermissionCode;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE acl_entries SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "acl_entries", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "resource_type", "resource_id", "principal_id",
                                "permission_code", "is_deleted" }, name = "uk_acl_resource_principal_perm")
}, indexes = {
                @Index(columnList = "resource_type,resource_id", name = "idx_acl_resource"),
                @Index(columnList = "principal_id", name = "idx_acl_principal"),
                @Index(columnList = "permission_code", name = "idx_acl_permission"),
                @Index(columnList = "is_deleted", name = "idx_aclentry_is_deleted")
})
@SQLRestriction("is_deleted = false")
// cấp quyền truy cập cho một tài nguyên cụ thể (ví dụ: cuộc họp, tài liệu)
// cho một người dùng hoặc nhóm người dùng (principal) với một mã quyền cụ thể.
// ACL (Access Control List) là một cách phổ biến để quản lý quyền truy cập
// trong các hệ thống phần mềm.
public class AclEntry extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Enumerated(EnumType.STRING)
        @Column(name = "resource_type")
        private ResourceType resourceType;

        @Column(name = "resource_id")
        private UUID resourceId;

        @Enumerated(EnumType.STRING)
        @Column(name = "permission_code")
        private AclPermissionCode permissionCode;

        private LocalDateTime grantedAt;

        private LocalDateTime expiresAt;

        @Column(name = "revoked_at")
        private LocalDateTime revokedAt;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "principal_id")
        private AclPrincipal principal;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "granted_by")
        private User grantedBy;
}
