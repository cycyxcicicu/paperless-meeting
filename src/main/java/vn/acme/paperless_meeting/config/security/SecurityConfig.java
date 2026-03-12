package vn.acme.paperless_meeting.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

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
     * cấu hình Spring Security
     * qua các filter security
     * kiểm tra CSRF
     * kiểm tra auth
     * kiểm tra quyền
     * rồi mới tới controller
     */

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http 
            .cors(Customizer.withDefaults()) // bật cros canaf khì fontend chạy domain khác backend 

            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()) /*Spring tạo CSRF token lưu token này trong cookie XSRF-TOKEN frontend đọc cookie đó gửi lại vào header X-XSRF-TOKEN */
                .ignoringRequestMatchers(PublicEndpoint.allPaths()) /* bỏ qua CSRF cho các public endpoint */
            )
            //đừng tạo và đừng dùng session server-side để lưu trạng thái đăng nhập. JWT đã lưu trạng thái trong token rồi, server không cần lưu nữa, mỗi request đều phải gửi token lên để xác thực
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // cái này để khi auth fail sẽ trả về 401, 
            //chứ không redirect sang trang login
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(securityExceptionHandlers.authenticationEntryPoint())
                .accessDeniedHandler(securityExceptionHandlers.accessDeniedHandler())
            )

            .authorizeHttpRequests(auth -> {
                   for (PublicEndpoint endpoint : PublicEndpoint.all()) {
                            auth.requestMatchers(endpoint.getMethod(), endpoint.getPath()).permitAll();
                        }
                        auth.requestMatchers(HttpMethod.POST, "/auth/logout").authenticated();
                        auth.anyRequest().authenticated();
            })

            .headers(headers -> headers
            /*trang web chỉ được phép nhúng trong iframe từ cùng origin giúp giảm clickjacking */
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self'; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data:; " +
                    "font-src 'self' data:;"
                ))
            )

            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}