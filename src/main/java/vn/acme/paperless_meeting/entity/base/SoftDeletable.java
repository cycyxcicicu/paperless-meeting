package vn.acme.paperless_meeting.entity.base;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.User;

/**
 * Base class cho entities hỗ trợ soft delete.
 * Các entity kế thừa từ class này sẽ:
 * - Tự động thêm cột: is_deleted, deleted_at, deleted_by
 * - Tự động filter @SQLRestriction("is_deleted = false") khi query
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@MappedSuperclass
@SQLRestriction("is_deleted = false")
public abstract class SoftDeletable {

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    private User deletedBy;

    // Phương thức helper
    public void softDelete(User deletedByUser) {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedByUser;
    }

    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
    }

    public boolean isDeleted() {
        return Boolean.TRUE.equals(this.isDeleted);
    }
}
