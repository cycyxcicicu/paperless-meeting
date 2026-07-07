package vn.acme.paperless_meeting.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai")
public record OpenAiProperties(
        String apiKey,
        String routerModel,
        String agentModel,
        String synthesisModel,
        Integer maxDocChars,
        Integer rateLimitPerMinute
) {
}
