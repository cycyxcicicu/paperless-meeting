package vn.acme.paperless_meeting.service.assistant.context;

import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.config.OpenAiProperties;
import vn.acme.paperless_meeting.entity.AgendaItem;
import vn.acme.paperless_meeting.entity.Document;
import vn.acme.paperless_meeting.entity.DocumentVersion;
import vn.acme.paperless_meeting.entity.MeetingDocument;
import vn.acme.paperless_meeting.repository.MeetingDocumentRepository;
import vn.acme.paperless_meeting.service.document.FileStorageService;

/**
 * Dựng lát dữ liệu "Tài liệu" cho Agent Tài liệu: metadata + text trích xuất từ PDF
 * (PDFBox). Text đã trích được cache theo DocumentVersion.id để nhiều câu hỏi liên
 * tiếp về cùng cuộc họp không phải trích lại từ MinIO mỗi lần.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentSlice {

    private static final String NOT_EXTRACTED_NOTE = "Không trích được nội dung (định dạng không hỗ trợ hoặc bản scan)";
    private static final String BUDGET_EXCEEDED_NOTE = "(chưa trích xuất - đã đạt giới hạn dung lượng ngữ cảnh)";

    private final MeetingDocumentRepository meetingDocumentRepository;
    private final FileStorageService fileStorageService;
    private final OpenAiProperties openAiProperties;

    private final Map<UUID, String> extractedTextCache = new ConcurrentHashMap<>();

    public String build(UUID meetingId) {
        List<MeetingDocument> docs = meetingDocumentRepository.findByMeetingIdWithDocsAndVersions(meetingId);
        int maxChars = openAiProperties.maxDocChars() != null ? openAiProperties.maxDocChars() : 60000;
        int[] remainingBudget = { maxChars };

        StringBuilder sb = new StringBuilder();
        sb.append("<danh_sach_tai_lieu>\n");
        for (MeetingDocument md : docs) {
            appendDocument(sb, md, remainingBudget);
        }
        sb.append("</danh_sach_tai_lieu>\n");
        return sb.toString();
    }

    private void appendDocument(StringBuilder sb, MeetingDocument md, int[] remainingBudget) {
        Document document = md.getDocument();
        DocumentVersion version = document != null ? document.getCurrentVersion() : null;
        AgendaItem agendaItem = md.getAgendaItem();

        String fileName = version != null && version.getFileName() != null ? version.getFileName()
                : (document != null ? document.getTitle() : "Không rõ tên file");
        String thuocNoiDung = agendaItem != null
                ? "Nội dung " + agendaItem.getOrderNo() + ": " + agendaItem.getTitle()
                : "Không gắn với nội dung cụ thể (phụ lục/tài liệu chung)";

        sb.append("  <tai_lieu")
                .append(" ten=\"").append(safe(fileName)).append("\"")
                .append(" thuoc_noi_dung=\"").append(safe(thuocNoiDung)).append("\"")
                .append(" loai_su_dung=\"").append(md.getUsageType() != null ? md.getUsageType().getDescription() : "-").append("\"")
                .append(" bao_mat=\"").append(Boolean.TRUE.equals(md.getIsConfidential()) ? "Có" : "Không").append("\"")
                .append(">\n");

        if (version == null || version.getStorageKey() == null) {
            sb.append("    <noi_dung_trich_xuat>").append(NOT_EXTRACTED_NOTE).append("</noi_dung_trich_xuat>\n");
        } else if (remainingBudget[0] <= 0) {
            sb.append("    <noi_dung_trich_xuat>").append(BUDGET_EXCEEDED_NOTE).append("</noi_dung_trich_xuat>\n");
        } else {
            String text = extractedTextCache.computeIfAbsent(version.getId(), id -> extractText(version));
            String trimmed = text.length() > remainingBudget[0] ? text.substring(0, remainingBudget[0]) + "..." : text;
            remainingBudget[0] -= trimmed.length();
            sb.append("    <noi_dung_trich_xuat>").append(safe(trimmed)).append("</noi_dung_trich_xuat>\n");
        }

        sb.append("  </tai_lieu>\n");
    }

    private String extractText(DocumentVersion version) {
        String fileName = version.getFileName() != null ? version.getFileName().toLowerCase(Locale.ROOT) : "";
        if (!fileName.endsWith(".pdf")) {
            return NOT_EXTRACTED_NOTE;
        }

        try (InputStream in = fileStorageService.getFileStream(version.getStorageKey())) {
            byte[] bytes = in.readAllBytes();
            try (PDDocument pdDocument = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(pdDocument);
                return text == null || text.isBlank() ? NOT_EXTRACTED_NOTE : text.trim();
            }
        } catch (Exception e) {
            log.warn("Trích xuất PDF thất bại cho storageKey='{}': {}", version.getStorageKey(), e.getMessage());
            return NOT_EXTRACTED_NOTE;
        }
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\"", "'");
    }
}
