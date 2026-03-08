package vn.acme.paperless_meeting.entity;

import java.util.UUID;

import jakarta.persistence.Entity;
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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vote_eligibilities", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "vote_session_id", "user_id" }, name = "uk_voteeligibility_session_user")
}, indexes = {
        @Index(columnList = "vote_session_id", name = "idx_voteeligibility_session"),
        @Index(columnList = "user_id", name = "idx_voteeligibility_user")
})
public class VoteEligibility {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private Boolean eligible;
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_session_id", nullable = false)
    private VoteSession voteSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
