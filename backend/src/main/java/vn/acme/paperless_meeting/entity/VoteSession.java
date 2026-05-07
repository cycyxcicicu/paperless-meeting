package vn.acme.paperless_meeting.entity;

import java.math.BigDecimal;
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
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.VotePassRule;
import vn.acme.paperless_meeting.entity.enums.VoteSessionStatus;
import vn.acme.paperless_meeting.entity.enums.VoteType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE vote_sessions SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "vote_sessions", indexes = {
        @Index(columnList = "meeting_id", name = "idx_votesession_meeting"),
        @Index(columnList = "motion_id", name = "idx_votesession_motion"),
        @Index(columnList = "status", name = "idx_votesession_status"),
        @Index(columnList = "opened_at", name = "idx_votesession_opened_at"),
        @Index(columnList = "is_deleted", name = "idx_votesession_is_deleted")
})
@SQLRestriction("is_deleted = false")
public class VoteSession extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;
    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private VoteSessionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type")
    private VoteType voteType;

    private Boolean isAnonymous;

    private Boolean allowChangeVote;

    private BigDecimal quorumRequiredPct;

    @Enumerated(EnumType.STRING)
    @Column(name = "pass_rule")
    private VotePassRule passRule;

    private BigDecimal passThresholdPct;
    private Integer minChoices;
    private Integer maxChoices;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motion_id")
    private Motion motion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id")
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToOne(mappedBy = "voteSession", fetch = FetchType.LAZY)
    private VoteResult voteResult;

    @OneToMany(mappedBy = "voteSession", orphanRemoval = false)
    private List<VoteOption> voteOptionList = new ArrayList<>();

    @OneToMany(mappedBy = "voteSession", orphanRemoval = false)
    private List<VoteEligibility> voteEligibilityList = new ArrayList<>();

    @OneToMany(mappedBy = "voteSession", orphanRemoval = false)
    private List<VoteBallot> voteBallotList = new ArrayList<>();

    @OneToMany(mappedBy = "voteSession", orphanRemoval = false)
    private List<VoteResultOption> voteResultOptionList = new ArrayList<>();
}
