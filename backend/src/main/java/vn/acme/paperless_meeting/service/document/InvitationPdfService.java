package vn.acme.paperless_meeting.service.document;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import com.lowagie.text.pdf.BaseFont;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InvitationPdfService {

    TemplateEngine templateEngine;

    public byte[] generatePdf(Map<String, Object> templateData, Map<String, String> sampleData) {
        try {
            // 1. Thay thế các biến {{variable}} bằng dữ liệu từ sampleData
            Map<String, Object> compiledData = compileTemplateData(templateData, sampleData);

            // 2. Khử độc HTML trong phần noiDung
            String rawNoiDung = (String) compiledData.get("noiDung");
            String sanitizedNoiDung = sanitizeHtml(rawNoiDung);
            compiledData.put("noiDung", sanitizedNoiDung);

            // 3. Tách các dòng cho headerTrai, headerPhai để format riêng biệt
            String rawHeaderTrai = (String) templateData.get("headerTrai");
            List<String> headerTraiLines = new ArrayList<>();
            if (rawHeaderTrai != null) {
                String compiledHeaderTrai = compileSingleString(rawHeaderTrai, sampleData);
                for (String line : compiledHeaderTrai.split("\n")) {
                    if (!line.trim().isEmpty()) {
                        headerTraiLines.add(line.trim());
                    }
                }
            }
            compiledData.put("headerTraiLines", headerTraiLines);

            String rawHeaderPhai = (String) templateData.get("headerPhai");
            List<String> headerPhaiLines = new ArrayList<>();
            if (rawHeaderPhai != null) {
                String compiledHeaderPhai = compileSingleString(rawHeaderPhai, sampleData);
                for (String line : compiledHeaderPhai.split("\n")) {
                    if (!line.trim().isEmpty()) {
                        headerPhaiLines.add(line.trim());
                    }
                }
            }
            compiledData.put("headerPhaiLines", headerPhaiLines);

            // 4. Tách phần chữ ký (chuKy) thành Chức vụ và Họ tên
            String rawChuKy = (String) templateData.get("chuKy");
            String chuKyChucVu = "";
            String chuKyHoTen = "";
            if (rawChuKy != null) {
                String compiledChuKy = compileSingleString(rawChuKy, sampleData);
                String[] parts = compiledChuKy.split("\n+");
                if (parts.length >= 2) {
                    chuKyChucVu = parts[0].trim();
                    chuKyHoTen = parts[parts.length - 1].trim();
                } else if (parts.length == 1) {
                    chuKyChucVu = parts[0].trim();
                }
            }
            compiledData.put("chuKyChucVu", chuKyChucVu);
            compiledData.put("chuKyHoTen", chuKyHoTen);

            // 5. Render HTML qua Thymeleaf
            Context context = new Context();
            context.setVariable("templateData", compiledData);
            String htmlContent = templateEngine.process("invitation/meeting-invitation", context);

            // 6. Sinh PDF bằng Flying Saucer
            return renderHtmlToPdf(htmlContent);
        } catch (Exception e) {
            log.error("Lỗi khi sinh PDF từ mẫu thư mời", e);
            throw new AppException(ErrorCode.TEMPLATE_RENDER_FAILED);
        }
    }

    public String compileSingleString(String templateStr, Map<String, String> sampleData) {
        if (templateStr == null) {
            return "";
        }
        String strValue = templateStr;
        if (sampleData != null) {
            for (Map.Entry<String, String> var : sampleData.entrySet()) {
                String placeholder = "{{" + var.getKey() + "}}";
                String replacement = var.getValue() != null ? var.getValue() : "";
                strValue = strValue.replace(placeholder, replacement);
            }
        }
        strValue = strValue.replaceAll("\\{\\{.*?\\}\\}", "");
        return strValue;
    }

    private Map<String, Object> compileTemplateData(Map<String, Object> templateData, Map<String, String> sampleData) {
        Map<String, Object> compiled = new HashMap<>();
        for (Map.Entry<String, Object> entry : templateData.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value instanceof String) {
                String strValue = (String) value;
                if (sampleData != null) {
                    for (Map.Entry<String, String> var : sampleData.entrySet()) {
                        String placeholder = "{{" + var.getKey() + "}}";
                        String replacement = var.getValue() != null ? var.getValue() : "";
                        strValue = strValue.replace(placeholder, replacement);
                    }
                }
                // Xóa các biến chưa được truyền dữ liệu (tránh lộ cú pháp {{...}})
                strValue = strValue.replaceAll("\\{\\{.*?\\}\\}", "");
                
                // Thay thế \n hoặc \r\n thành <br/> để hiển thị xuống dòng chính xác trên PDF
                strValue = strValue.replace("\r\n", "<br/>").replace("\n", "<br/>");
                
                compiled.put(key, strValue);
            } else {
                compiled.put(key, value);
            }
        }
        return compiled;
    }

    private String sanitizeHtml(String html) {
        if (html == null) {
            return "";
        }
        Safelist safelist = Safelist.relaxed()
                .addTags("span", "u", "br", "p", "strong", "em", "ol", "ul", "li")
                .addAttributes("span", "style")
                .addAttributes("p", "style")
                .addAttributes("strong", "style")
                .addAttributes("em", "style");
        
        org.jsoup.nodes.Document.OutputSettings settings = new org.jsoup.nodes.Document.OutputSettings();
        settings.syntax(org.jsoup.nodes.Document.OutputSettings.Syntax.xml);
        settings.escapeMode(org.jsoup.nodes.Entities.EscapeMode.xhtml);
        settings.prettyPrint(false);

        return Jsoup.clean(html, "", safelist, settings);
    }

    private byte[] renderHtmlToPdf(String htmlContent) throws Exception {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();

            // Đăng ký các font Unicode hỗ trợ tiếng Việt (Arial & Times New Roman)
            registerFonts(renderer);

            // Convert HTML to valid XHTML
            org.jsoup.nodes.Document doc = Jsoup.parse(htmlContent, "UTF-8");
            doc.outputSettings().syntax(org.jsoup.nodes.Document.OutputSettings.Syntax.xml);
            doc.outputSettings().escapeMode(org.jsoup.nodes.Entities.EscapeMode.xhtml);
            String xhtml = doc.html();

            // Gán nội dung HTML dạng UTF-8
            renderer.setDocumentFromString(xhtml);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        }
    }

    private void registerFonts(ITextRenderer renderer) {
        try {
            // Danh sách các file font đã được lưu trong resources
            String[] fonts = {
                "arial.ttf", "arialbd.ttf", "ariali.ttf", "arialbi.ttf",
                "times.ttf", "timesbd.ttf", "timesi.ttf", "timesbi.ttf"
            };

            for (String font : fonts) {
                String fontPath = getFontPath(font);
                if (fontPath != null) {
                    renderer.getFontResolver().addFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                }
            }
        } catch (Exception e) {
            log.error("Không thể đăng ký font tiếng Việt cho PDF", e);
        }
    }

    private String getFontPath(String fontFile) {
        try {
            ClassPathResource resource = new ClassPathResource("fonts/" + fontFile);
            if (resource.exists()) {
                URL url = resource.getURL();
                return url.toExternalForm();
            }
        } catch (IOException e) {
            log.warn("Không tìm thấy font {} trong classpath, sử dụng đường dẫn fallback", fontFile);
        }
        
        // Fallback đường dẫn trên disk
        File fallbackFile = new File("src/main/resources/fonts/" + fontFile);
        if (fallbackFile.exists()) {
            return fallbackFile.getAbsolutePath();
        }
        return null;
    }
}
