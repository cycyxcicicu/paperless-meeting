package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.UserStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE users SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "users", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "username", "is_deleted" }, name = "uk_user_username"),
                @UniqueConstraint(columnNames = { "email", "is_deleted" }, name = "uk_user_email"),
                @UniqueConstraint(columnNames = { "phone", "is_deleted" }, name = "uk_user_phone")
}, indexes = {
                @Index(columnList = "username", name = "idx_user_username"),
                @Index(columnList = "email", name = "idx_user_email"),
                @Index(columnList = "is_deleted", name = "idx_user_is_deleted")
})
@SQLRestriction("is_deleted = false")
public class User extends SoftDeletable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private String username;
        private String passwordHash;
        private String email;
        private String phone;

        @Enumerated(EnumType.STRING)
        @Column(name = "status")
        private UserStatus status;
        private String avatar;
        private LocalDateTime createdAt;

        @OneToMany(mappedBy = "createdBy")
        private List<Meeting> meetingList = new ArrayList<>();

        @OneToMany(mappedBy = "ownerUser")
        private List<AgendaItem> agendaItemList = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<Minutes> minutesList = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<Document> documentList = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<DocumentVersion> documentVersionList = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<Motion> motionList = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<VoteSession> voteSessionList = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<DocTemplate> docTemplateList = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<GeneratedDocument> generatedDocumentList = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<UserDepartment> userDepartmentList = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<MeetingParticipant> meetingParticipantList = new ArrayList<>();

        @OneToMany(mappedBy = "inviteeUser")
        private List<MeetingInvitation> meetingInvitationByInviteeUser = new ArrayList<>();

        @OneToMany(mappedBy = "invitedBy")
        private List<MeetingInvitation> meetingInvitationByInvitedBy = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<AttendanceLog> attendanceLogByUser = new ArrayList<>();

        @OneToMany(mappedBy = "recordedBy")
        private List<AttendanceLog> attendanceLogByRecordedBy = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<SpeakerQueue> speakerQueueList = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<SpeakerTurn> speakerTurnByUser = new ArrayList<>();

        @OneToMany(mappedBy = "createdBy")
        private List<SpeakerTurn> speakerTurnByCreatedBy = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<UserRoleScope> userRoleScopeByUser = new ArrayList<>();

        @OneToMany(mappedBy = "assignedBy")
        private List<UserRoleScope> userRoleScopeByAssignedBy = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<AclPrincipal> aclPrincipalList = new ArrayList<>();

        @OneToMany(mappedBy = "grantedBy")
        private List<AclEntry> aclEntryList = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<DocumentAccessLog> documentAccessLogList = new ArrayList<>();

        @OneToMany(mappedBy = "requestedBy")
        private List<ApprovalRequest> approvalRequestList = new ArrayList<>();

        @OneToMany(mappedBy = "approverUser")
        private List<ApprovalStep> approvalStepList = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<VoteEligibility> voteEligibilityList = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<VoteBallot> voteBallotList = new ArrayList<>();

        @OneToMany(mappedBy = "computedBy")
        private List<VoteResult> voteResultList = new ArrayList<>();

        @OneToMany(mappedBy = "actorUser")
        private List<AuditLog> auditLogList = new ArrayList<>();

        @OneToMany(mappedBy = "user")
        private List<Notification> notificationList = new ArrayList<>();
}
