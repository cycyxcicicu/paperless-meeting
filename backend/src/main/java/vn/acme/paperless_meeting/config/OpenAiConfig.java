package vn.acme.paperless_meeting.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class OpenAiConfig {

    private final OpenAiProperties openAiProperties;

    @Bean
    public OpenAIClient openAIClient() {
        String apiKey = openAiProperties.apiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OPENAI_API_KEY chưa được cấu hình - trợ lý AI cuộc họp sẽ báo lỗi khi được gọi");
            apiKey = "not-configured";
        }
        return OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .build();
    }
}
