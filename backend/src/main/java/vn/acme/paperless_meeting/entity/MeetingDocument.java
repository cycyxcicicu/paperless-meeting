package vn.acme.paperless_meeting.entity;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.enums.MeetingDocumentUsageType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "meeting_documents", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "meeting_id", "doc_id" }, name = "uk_meetingdoc_meeting_doc")
}, indexes = {
        @Index(columnList = "meeting_id", name = "idx_meetingdoc_meeting"),
        @Index(columnList = "doc_id", name = "idx_meetingdoc_doc")
})

// gắn tài liệu vào cuộc họp
public class MeetingDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "usage_type")
    private MeetingDocumentUsageType usageType;

    private Boolean requiredBeforeMeeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doc_id", nullable = false)
    private Document document;
}
