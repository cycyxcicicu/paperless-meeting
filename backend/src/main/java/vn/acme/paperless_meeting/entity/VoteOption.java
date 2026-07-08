package vn.acme.paperless_meeting.entity;

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
@Table(name = "vote_options", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "vote_session_id", "orderNo" }, name = "uk_voteoption_session_order")
}, indexes = {
                @Index(columnList = "vote_session_id", name = "idx_voteoption_session")
               
})

public class VoteOption {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private String label;
        private Integer orderNo;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "vote_session_id")
        private VoteSession voteSession;

        @OneToMany(mappedBy = "option", orphanRemoval = false)
        private List<VoteBallotChoice> voteBallotChoiceList = new ArrayList<>();

        @OneToMany(mappedBy = "option", orphanRemoval = false)
        private List<VoteResultOption> voteResultOptionList = new ArrayList<>();
}
