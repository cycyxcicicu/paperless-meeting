package vn.acme.paperless_meeting.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;

@ConfigurationProperties(prefix = "spring.mail")
@Validated
public record MailProperties(
    @NotBlank String username
) {
    public String from() {
        return username;
    }
}
