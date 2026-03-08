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
import vn.acme.paperless_meeting.entity.enums.ApprovalDecision;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE approval_steps SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "approval_steps", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "approval_id", "step_no",
                                "is_deleted" }, name = "uk_approvalstep_approval_no")
}, indexes = {
                @Index(columnList = "approval_id", name = "idx_approvalstep_approval"),
                @Index(columnList = "is_deleted", name = "idx_approvalstep_is_deleted")
})
@SQLRestriction("is_deleted = false")
// Các bước phê duyệt cho một yêu cầu duyệt,
// có thể bao gồm nhiều bước với các người phê duyệt khác nhau và quyết định
// khác nhau.
public class ApprovalStep extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private Integer stepNo;

        @Enumerated(EnumType.STRING)
        @Column(name = "decision")
        private ApprovalDecision decision;

        private LocalDateTime decidedAt;

        private String comment;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "approval_id")
        private ApprovalRequest approvalRequest;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "approver_user_id")
        private User approverUser;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "approver_role_id")
        private Role approverRole;
}
