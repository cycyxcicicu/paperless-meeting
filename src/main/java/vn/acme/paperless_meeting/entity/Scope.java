package vn.acme.paperless_meeting.entity;

import java.util.ArrayList;
import java.util.List;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.ScopeType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity

@Table(name = "scopes", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "scope_type", "dept_id" }, name = "uk_scope_type_dept"),
                @UniqueConstraint(columnNames = { "scope_type", "meeting_id" }, name = "uk_scope_type_meeting")
}, indexes = {
                @Index(columnList = "scope_type", name = "idx_scope_type")
})

public class Scope {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Enumerated(EnumType.STRING)
        @Column(name = "scope_type", nullable = false)
        private ScopeType scopeType;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "dept_id")
        private Department department;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "meeting_id")
        private Meeting meeting;

        @OneToMany(mappedBy = "scope")
        private List<UserRoleScope> userRoleScopeList = new ArrayList<>();
}
