package vn.acme.paperless_meeting.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletResponse;

// Lớp này sẽ chịu trách nhiệm tạo và xóa cookie chứa access token và refresh token trong response
@Service
public class AuthCookieService {

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Value("${app.security.cookie-domain:}")
    private String cookieDomain;

    @Value("${app.security.secure-cookies}")
    private boolean secureCookies;

    @Value("${app.security.access-token-cookie-name}")
    private String accessTokenCookieName;

    @Value("${app.security.refresh-token-cookie-name}")
    private String refreshTokenCookieName;

    @Value("${app.security.access-token-expiration-seconds}")
    private long accessTokenAge;

    @Value("${app.security.refresh-token-expiration-seconds}")
    private long refreshTokenAge;



    public void addAccessTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(accessTokenCookieName, token)
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .sameSite("Lax") // Nếu thực sự cross-origin, thay "Lax" thành "None" và đảm bảo secure=true
                .maxAge(accessTokenAge);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void addRefreshTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(refreshTokenCookieName, token)
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .sameSite("Strict")
                .maxAge(refreshTokenAge);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void clearAccessTokenCookie(HttpServletResponse response) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(accessTokenCookieName, "")
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .sameSite("Lax")
                .maxAge(0);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(refreshTokenCookieName, "")
                .httpOnly(true)
                .secure(secureCookies)
                .path("/")
                .sameSite("Strict")
                .maxAge(0);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }
}