package vn.acme.paperless_meeting.service.email;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.config.MailProperties;
import org.springframework.core.io.ByteArrayResource;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailService {
    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            log.info("Đang gửi email tới: {} với tiêu đề: {}", toEmail, subject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailProperties.from());
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Đã gửi email thành công qua SMTP tới: {}", toEmail);
        } catch (Exception e) {
            log.error("Gửi email qua SMTP thất bại tới: {}", toEmail, e);
            throw new RuntimeException("Gửi email SMTP thất bại: " + e.getMessage());
        }
    }

    public void sendHtmlEmailWithAttachment(String toEmail, String subject, String htmlContent, String filename, String base64Content) {
        try {
            log.info("Đang gửi email đính kèm tới: {} với tiêu đề: {}", toEmail, subject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailProperties.from());
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            byte[] pdfBytes = Base64.getDecoder().decode(base64Content);
            helper.addAttachment(filename, new ByteArrayResource(pdfBytes), "application/pdf");
            
            mailSender.send(message);
            log.info("Đã gửi email kèm file đính kèm thành công qua SMTP tới: {}", toEmail);
        } catch (Exception e) {
            log.error("Gửi email đính kèm qua SMTP thất bại tới: {}", toEmail, e);
            throw new RuntimeException("Gửi email đính kèm SMTP thất bại: " + e.getMessage());
        }
    }
}
