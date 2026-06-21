package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.CascadeType;
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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.acme.paperless_meeting.entity.base.SoftDeletable;
import vn.acme.paperless_meeting.entity.enums.DocumentStatus;
import vn.acme.paperless_meeting.entity.enums.DocumentType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE documents SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "documents", indexes = {
        @Index(columnList = "owner_dept_id", name = "idx_document_owner_dept"),
        @Index(columnList = "status", name = "idx_document_status"),
        @Index(columnList = "created_by", name = "idx_document_created_by"),
        @Index(columnList = "is_deleted", name = "idx_document_is_deleted")
})
@SQLRestriction("is_deleted = false")
public class Document extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type")
    private DocumentType docType;

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DocumentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_version_id")
    private DocumentVersion currentVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_dept_id")
    private Department ownerDepartment;

    @OneToMany(mappedBy = "document", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<DocumentVersion> documentVersionList = new ArrayList<>();

    @OneToMany(mappedBy = "fileDocument", orphanRemoval = false)
    private List<DocTemplate> docTemplateList = new ArrayList<>();



    @OneToMany(mappedBy = "document", orphanRemoval = false)
    private List<MeetingDocument> meetingDocumentList = new ArrayList<>();


}
