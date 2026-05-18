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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.AgendaItemStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE agenda_items SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "agenda_items", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "meeting_id", "order_no",
                                "is_deleted" }, name = "uk_agenda_meeting_order")
}, indexes = {
                @Index(columnList = "meeting_id", name = "idx_agenda_meeting"),
                @Index(columnList = "owner_user_id", name = "idx_agenda_owner"),
                @Index(columnList = "status", name = "idx_agenda_status"),
                @Index(columnList = "is_deleted", name = "idx_agenda_is_deleted")
})
@SQLRestriction("is_deleted = false")
// Mục chương trình họp theo thứ tự.
public class AgendaItem extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private String title;
        private String content;
        private Integer orderNo;
        private Integer durationEst;

        private LocalDateTime prepDeadline;

        @Enumerated(EnumType.STRING)
        @Column(name = "status")
        private AgendaItemStatus status;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "meeting_id")
        private Meeting meeting;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "owner_user_id")
        private User ownerUser;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "prepared_by_user_id")
        private User preparedByUser;

        @Column(name = "start_time")
        private LocalDateTime startTime;

        @Column(name = "end_time")
        private LocalDateTime endTime;

        @Column(name = "reject_reason", length = 1000)
        private String rejectReason;

        @OneToMany(mappedBy = "agendaItem", orphanRemoval = false)
        private List<Motion> motionList = new ArrayList<>();

        @OneToMany(mappedBy = "agendaItem", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<SpeakerQueue> speakerQueueList = new ArrayList<>();

        @OneToMany(mappedBy = "agendaItem", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<SpeakerTurn> speakerTurnList = new ArrayList<>();
}
