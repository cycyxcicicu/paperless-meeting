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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.AttendanceStatus;
import vn.acme.paperless_meeting.entity.enums.InviteStatus;
import vn.acme.paperless_meeting.entity.enums.SendStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@SQLDelete(sql = "UPDATE meeting_guests SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "meeting_guests", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "meeting_id", "email", "is_deleted" }, name = "uk_guest_meeting_email")
}, indexes = {
        @Index(columnList = "meeting_id", name = "idx_guest_meeting"),
        @Index(columnList = "rsvp_token", name = "idx_guest_rsvp_token"),
        @Index(columnList = "guest_token", name = "idx_guest_guest_token"),
        @Index(columnList = "is_deleted", name = "idx_guest_is_deleted")
})
@SQLRestriction("is_deleted = false")
public class MeetingGuest extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String gender;

    @Column(nullable = false)
    private String email;

    private String phone;

    private String company;

    private String position;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "rsvp_token")
    private UUID rsvpToken;

    @Column(name = "guest_token")
    private UUID guestToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "invite_status")
    private InviteStatus inviteStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status")
    private AttendanceStatus attendanceStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "send_status")
    private SendStatus sendStatus;

    private String note;

    @Builder.Default
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
}
