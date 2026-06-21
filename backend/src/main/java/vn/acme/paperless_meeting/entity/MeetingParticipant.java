package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.Set;
import java.util.HashSet;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.ParticipantRole;
import vn.acme.paperless_meeting.entity.enums.SendStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE meeting_participants SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "meeting_participants", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "meeting_id", "user_id",
                                "is_deleted" }, name = "uk_participant_meeting_user")
}, indexes = {
                @Index(columnList = "meeting_id", name = "idx_participant_meeting"),
                @Index(columnList = "user_id", name = "idx_participant_user"),
                @Index(columnList = "is_deleted", name = "idx_participant_is_deleted")
})
@SQLRestriction("is_deleted = false")
// danh sách tham dự + vai trò + RSVP.
public class MeetingParticipant extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Enumerated(EnumType.STRING)
        @Column(name = "participant_role")
        private ParticipantRole participantRole;

        @Enumerated(EnumType.STRING)
        @Column(name = "invite_status")
        private InviteStatus inviteStatus;

        @Enumerated(EnumType.STRING)
        @Column(name = "attendance_status")
        private AttendanceStatus attendanceStatus;

        @Enumerated(EnumType.STRING)
        @Column(name = "send_status")
        private SendStatus sendStatus = SendStatus.PENDING;

        private String note;

        @Column(name = "decline_reason")
        private String declineReason;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "substitute_user_id")
        private User substituteUser;

        @Column(name = "substitute_name")
        private String substituteName;

        @Column(name = "substitute_position")
        private String substitutePosition;

        @Column(name = "substitute_company")
        private String substituteCompany;

        @Column(name = "substitute_department")
        private String substituteDepartment;

        @Column(name = "substitute_email")
        private String substituteEmail;

        @Column(name = "substitute_phone")
        private String substitutePhone;

        @Column(name = "is_full_session")
        private Boolean isFullSession = true;

        @ElementCollection
        @CollectionTable(
                name = "participant_absent_agenda_items",
                joinColumns = @JoinColumn(name = "participant_id")
        )
        @Column(name = "agenda_item_id")
        private Set<UUID> absentAgendaItemIds = new HashSet<>();

        @Column(name = "is_substitute")
        private Boolean isSubstitute = false;

        @Column(name = "substitute_for_participant_id")
        private UUID substituteForParticipantId;

        @CreationTimestamp
        @Column(name = "created_at", updatable = false)
        private LocalDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "meeting_id")
        private Meeting meeting;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id")
        private User user;
}
