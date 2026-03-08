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
@Table(name = "vote_ballot_choices", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "ballot_id", "option_id" }, name = "uk_ballotchoice_ballot_option")
}, indexes = {
                @Index(columnList = "ballot_id", name = "idx_ballotchoice_ballot"),
                @Index(columnList = "option_id", name = "idx_ballotchoice_option")
        
})

public class VoteBallotChoice {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "ballot_id", nullable = false)
        private VoteBallot ballot;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "option_id", nullable = false)
        private VoteOption option;
}
