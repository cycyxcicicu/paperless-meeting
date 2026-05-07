package vn.acme.paperless_meeting.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Column;
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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "document_versions", indexes = {
        @Index(columnList = "doc_id", name = "idx_docversion_doc"),
        @Index(columnList = "created_at", name = "idx_docversion_created_at"),
       
})

// Version file thực tế
public class DocumentVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String storageKey;

    private String fileUrl;

    private String fileName;

    private Long fileSize;

    private String checksum;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doc_id")
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "currentVersion")
    private List<Document> documentList = new ArrayList<>();

    @OneToMany(mappedBy = "version")
    private List<DocumentAccessLog> documentAccessLogList = new ArrayList<>();
}
