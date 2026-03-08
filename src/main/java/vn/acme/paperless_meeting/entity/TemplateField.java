package vn.acme.paperless_meeting.entity;

import java.util.UUID;

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
import vn.acme.paperless_meeting.entity.enums.TemplateSourceType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "template_fields", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "template_id", "field_key" }, name = "uk_templatefield_template_key")
}, indexes = {
                @Index(columnList = "template_id", name = "idx_templatefield_template")
              
})

public class TemplateField {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        private String fieldKey;
        @Enumerated(EnumType.STRING)
        private TemplateSourceType sourceType;
        private String sourcePath;
        private String formatRule;
        private Boolean isRequired;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "template_id")
        private DocTemplate template;
}
