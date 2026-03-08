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
import vn.acme.paperless_meeting.entity.enums.DocTemplateStatus;
import vn.acme.paperless_meeting.entity.enums.TemplateType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@SQLDelete(sql = "UPDATE doc_templates SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = false")
@Table(name = "doc_templates", indexes = {
        @Index(columnList = "status", name = "idx_doctemplate_status"),
        @Index(columnList = "is_deleted", name = "idx_doctemplate_is_deleted")
})
@SQLRestriction("is_deleted = false")
// Mẫu Word (thư mời/biên bản/agenda…), lưu như 1 Document.
public class DocTemplate extends SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type")
    private TemplateType templateType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DocTemplateStatus status;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_doc_id")
    private Document fileDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_dept_id")
    private Department ownerDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "template", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<TemplateField> templateFieldList = new ArrayList<>();

    @OneToMany(mappedBy = "template", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<GeneratedDocument> generatedDocumentList = new ArrayList<>();
}
