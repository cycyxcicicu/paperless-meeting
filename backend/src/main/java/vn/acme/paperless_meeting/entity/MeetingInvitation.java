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
import vn.acme.paperless_meeting.entity.enums.ChannelType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE meeting_invitations SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "meeting_invitations", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "meeting_id", "invitee_user_id",
                                "channel", "is_deleted" }, name = "uk_invitation_meeting_invitee_channel")
}, indexes = {
                @Index(columnList = "meeting_id", name = "idx_invitation_meeting"),
                @Index(columnList = "is_deleted", name = "idx_invitation_is_deleted")
})
@SQLRestriction("is_deleted = false")
public class MeetingInvitation extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Enumerated(EnumType.STRING)
        @Column(name = "channel")
        private ChannelType channel;

        @Enumerated(EnumType.STRING)
        @Column(name = "send_status")
        private vn.acme.paperless_meeting.entity.enums.SendStatus sendStatus = vn.acme.paperless_meeting.entity.enums.SendStatus.PENDING;

        private LocalDateTime sentAt;

        private String message;

        private LocalDateTime rsvpDeadline;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "meeting_id")
        private Meeting meeting;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "invitee_user_id")
        private User inviteeUser;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "invitee_guest_id")
        private MeetingGuest inviteeGuest;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "invited_by")
        private User invitedBy;
}
