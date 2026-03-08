package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.ApprovalStatus;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE approval_requests SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "approval_requests", indexes = {
        @Index(columnList = "resource_type,resource_id", name = "idx_approval_resource"),
        @Index(columnList = "status", name = "idx_approval_status"),
        @Index(columnList = "requested_by", name = "idx_approval_requested_by"),
        @Index(columnList = "is_deleted", name = "idx_approval_is_deleted")
})
@SQLRestriction("is_deleted = false")
// yêu cầu duyệt cho Document hoặc Minutes.
public class ApprovalRequest extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type")
    private ResourceType resourceType;

    @Column(name = "resource_id")
    private UUID resourceId;

    private LocalDateTime requestedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ApprovalStatus status;

    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    @OneToMany(mappedBy = "approvalRequest", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<ApprovalStep> approvalStepList = new ArrayList<>();
}