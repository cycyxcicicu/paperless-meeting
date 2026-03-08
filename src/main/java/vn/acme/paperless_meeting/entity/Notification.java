package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.ChannelType;
import vn.acme.paperless_meeting.entity.enums.NotificationStatus;
import vn.acme.paperless_meeting.entity.enums.NotificationType;
import vn.acme.paperless_meeting.entity.enums.ResourceType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications", indexes = {
        @Index(columnList = "user_id", name = "idx_notification_user"),
        @Index(columnList = "status", name = "idx_notification_status"),
        @Index(columnList = "scheduled_at", name = "idx_notification_scheduled"),
        @Index(columnList = "ref_type,ref_id", name = "idx_notification_ref")
})

public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private NotificationType type;
    private String content;
    @Enumerated(EnumType.STRING)
    private ChannelType channel;
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    @Column(name = "read_at")
    private LocalDateTime readAt;
    @Column(name = "archived_at")
    private LocalDateTime archivedAt;
    @Enumerated(EnumType.STRING)
    private NotificationStatus status;
    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type")
    private ResourceType refType;
    @Column(name = "ref_id")
    private UUID refId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
