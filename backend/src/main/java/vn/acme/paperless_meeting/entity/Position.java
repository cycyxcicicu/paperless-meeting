package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import vn.acme.paperless_meeting.entity.enums.PositionRole;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE position SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@SQLRestriction("is_deleted = false")
public class Position extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    String positionName;
    String positionCode;
    Integer rankOrder;
    Boolean isLeadership;
    @Enumerated(EnumType.STRING)
    PositionRole positionRole;
    String description;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    Department department;

}
