package vn.acme.paperless_meeting.entity;

import java.math.BigDecimal;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

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
import vn.acme.paperless_meeting.entity.base.SoftDeletable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE vote_result_options SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "vote_result_options", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "vote_session_id", "option_id",
                "is_deleted" }, name = "uk_voteresultoption_session_option")
}, indexes = {
        @Index(columnList = "vote_session_id", name = "idx_voteresultoption_session"),
        @Index(columnList = "option_id", name = "idx_voteresultoption_option")
})
@SQLRestriction("is_deleted = false")
public class VoteResultOption extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private Long voteCount;
    private BigDecimal weightSum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_session_id", nullable = false)
    private VoteSession voteSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id", nullable = false)
    private VoteOption option;
}
