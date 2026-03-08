package vn.acme.paperless_meeting.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Entity;
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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vote_ballots", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "vote_session_id", "user_id" }, name = "uk_ballot_session_user")
}, indexes = {
                @Index(columnList = "vote_session_id", name = "idx_ballot_session"),
                @Index(columnList = "user_id", name = "idx_ballot_user")
            
})

public class VoteBallot {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private LocalDateTime castAt;
        private BigDecimal weight;
        private Boolean isValid;
        private String invalidReason;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "vote_session_id")
        private VoteSession voteSession;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id")
        private User user;

        @OneToMany(mappedBy = "ballot", orphanRemoval = false)
        private List<VoteBallotChoice> voteBallotChoiceList = new ArrayList<>();
}
