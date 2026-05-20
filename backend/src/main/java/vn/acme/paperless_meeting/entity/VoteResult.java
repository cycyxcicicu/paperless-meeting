package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vote_results", indexes = {
                @Index(columnList = "computed_by", name = "idx_voteresult_computed_by")
})

public class VoteResult {

        @Id
        @Column(name = "vote_session_id")
        private UUID id;

        private Long totalEligible;
        private Long totalCast;
        private Long totalValid;
        private Boolean passed;
        private LocalDateTime computedAt;

        @MapsId
        @OneToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "vote_session_id", nullable = false)
        private VoteSession voteSession;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "computed_by")
        private User computedBy;
}
