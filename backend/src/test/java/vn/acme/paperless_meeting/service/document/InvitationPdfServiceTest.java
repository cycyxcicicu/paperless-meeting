package vn.acme.paperless_meeting.service.document;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import vn.acme.paperless_meeting.exceptions.AppException;

@ExtendWith(MockitoExtension.class)
class InvitationPdfServiceTest {

    @Mock
    TemplateEngine templateEngine;

    @InjectMocks
    InvitationPdfService invitationPdfService;

    private Map<String, String> sampleData;

    @BeforeEach
    void setUp() {
        sampleData = new HashMap<>();
        sampleData.put("meetingName", "Họp Ủy Ban Thành Phố");
        sampleData.put("meetingLocation", "Hội trường 1");
        sampleData.put("receiverName", "Nguyễn Văn A");
    }

    @Test
    void compileSingleString_withValidPlaceholders_shouldReplaceSuccessfully() {
        String template = "Kính gửi ông/bà {{receiverName}} đến dự cuộc họp {{meetingName}} tại {{meetingLocation}}.";
        String result = invitationPdfService.compileSingleString(template, sampleData);

        assertEquals("Kính gửi ông/bà Nguyễn Văn A đến dự cuộc họp Họp Ủy Ban Thành Phố tại Hội trường 1.", result);
    }

    @Test
    void compileSingleString_withMissingDataPlaceholders_shouldCleanThemUp() {
        String template = "Kính gửi {{receiverName}} tham dự {{missingVar}}.";
        String result = invitationPdfService.compileSingleString(template, sampleData);

        // Missing placeholder "{{missingVar}}" should be replaced with empty string
        assertEquals("Kính gửi Nguyễn Văn A tham dự .", result);
    }

    @Test
    void generatePdf_shouldSanitizeHtmlAndCompileData() {
        // Arrange
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("noiDung", "<p>Nội dung họp: <strong>{{meetingName}}</strong><script>alert('hack')</script></p>");
        templateData.put("headerTrai", "ỦY BAN NHÂN DÂN\n{{meetingLocation}}");
        templateData.put("headerPhai", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM");
        templateData.put("chuKy", "CHỦ TỊCH\n{{receiverName}}");

        when(templateEngine.process(eq("invitation/meeting-invitation"), any(Context.class)))
                .thenReturn("<html><body>Mock PDF Content</body></html>");

        // Act
        byte[] pdfBytes = invitationPdfService.generatePdf(templateData, sampleData);

        // Assert
        assertNotNull(pdfBytes);
        // The script tag must be sanitized out from templateEngine context variable "noiDung"
        verify(templateEngine).process(eq("invitation/meeting-invitation"), argThat(context -> {
            Map<String, Object> compiled = (Map<String, Object>) context.getVariable("templateData");
            String noiDung = (String) compiled.get("noiDung");
            
            // Script tag should be removed, but strong and p tags should remain
            return noiDung.contains("<strong>Họp Ủy Ban Thành Phố</strong>") && !noiDung.contains("<script>");
        }));
    }

    @Test
    void generatePdf_whenExceptionOccurs_shouldThrowAppException() {
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("noiDung", "Họp");

        when(templateEngine.process(any(String.class), any(Context.class)))
                .thenThrow(new RuntimeException("Template processing failed"));

        assertThrows(AppException.class, () -> invitationPdfService.generatePdf(templateData, sampleData));
    }
}
