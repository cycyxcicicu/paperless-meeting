package vn.acme.paperless_meeting.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.enums.PublicEndpoint;
import vn.acme.paperless_meeting.service.auth.JwtAuthenticationFilter;
import vn.acme.paperless_meeting.service.auth.SecurityExceptionHandlers;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SecurityExceptionHandlers securityExceptionHandlers;

    /*
     * cấu hình Spring Security cho REST API stateless với JWT
     * mỗi request phải gửi JWT token lên trong Authorization header hoặc cookie
     * CSRF không cần vì:
     * - JWT đã bảo vệ bằng signature, không thể giả mạo
     * - REST API thường được gọi từ mobile app, backend-to-backend, không có CSRF
     * risk
     * - Access token lưu trong httpOnly cookie nên XSS không thể trích xuất
     */

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())

                // CSRF disabled: JWT authentication không yêu cầu CSRF protection
                .csrf(csrf -> csrf.disable())

                // Stateless: không tạo session server-side
                // JWT handle authentication, mỗi request độc lập
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // cái này để khi auth fail sẽ trả về 401,
                // chứ không redirect sang trang login
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(securityExceptionHandlers.authenticationEntryPoint())
                        .accessDeniedHandler(securityExceptionHandlers.accessDeniedHandler()))

                .authorizeHttpRequests(auth -> {
                    for (PublicEndpoint endpoint : PublicEndpoint.all()) {
                        auth.requestMatchers(endpoint.getMethod(), endpoint.getPath()).permitAll();
                    }
                    // auth.requestMatchers(HttpMethod.POST, "/auth/logout").authenticated();
                    auth.anyRequest().authenticated();
                })

                .headers(headers -> headers
                        /*
                         * trang web chỉ được phép nhúng trong iframe từ cùng origin giúp giảm
                         * clickjacking
                         */
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; " +
                                        "script-src 'self'; " +
                                        "style-src 'self' 'unsafe-inline'; " +
                                        "img-src 'self' data:; " +
                                        "font-src 'self' data:;")))

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}