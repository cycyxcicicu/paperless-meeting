package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
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
import vn.acme.paperless_meeting.entity.enums.MeetingStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE meetings SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "meetings", indexes = {
        @Index(columnList = "start_time", name = "idx_meeting_start_time"),
        @Index(columnList = "status", name = "idx_meeting_status"),
        @Index(columnList = "created_by", name = "idx_meeting_created_by"),
        @Index(columnList = "dept_id", name = "idx_meeting_dept"),
        @Index(columnList = "location_id", name = "idx_meeting_location"),
        @Index(columnList = "is_deleted", name = "idx_meeting_is_deleted")
})
@SQLRestriction("is_deleted = false")
public class Meeting extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;
    @Column(name = "start_time")
    private LocalDateTime startTime;
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "rsvp_deadline")
    private LocalDateTime rsvpDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private MeetingStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "online_link")
    private String onlineLink;
    
    private Integer lateAfterMinutes;

    private String cancelReason;
    private String deleteReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;

    @OneToMany(mappedBy = "meeting", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = false)
    private List<AgendaItem> agendaItemList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", orphanRemoval = false)
    private List<Minutes> minutesList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", orphanRemoval = false)
    private List<Motion> motionList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", orphanRemoval = false)
    private List<VoteSession> voteSessionList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", orphanRemoval = false)
    private List<GeneratedDocument> generatedDocumentList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = false)
    private List<MeetingParticipant> meetingParticipantList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = false)
    private List<MeetingInvitation> meetingInvitationList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = false)
    private List<AttendanceLog> attendanceLogList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", orphanRemoval = false)
    private List<MeetingDocument> meetingDocumentList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = false)
    private List<SpeakerQueue> speakerQueueList = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = false)
    private List<SpeakerTurn> speakerTurnList = new ArrayList<>();

}
