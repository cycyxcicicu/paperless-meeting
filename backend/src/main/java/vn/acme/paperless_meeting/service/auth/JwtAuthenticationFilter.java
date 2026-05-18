package vn.acme.paperless_meeting.service.auth;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.service.util.CookieUtil;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenVerifier jwtTokenVerifier;
    private final SecurityUserDetailsService userDetailsService;

    @Value("${app.security.access-token-cookie-name}")
    private String accessTokenCookieName;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = resolveAccessToken(request);

        if (token == null || SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (!jwtTokenVerifier.isAccessToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            String username = jwtTokenVerifier.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities());

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Xử lý Strict Backend Check cho First Login
            if (userDetails instanceof UserPrincipal) {
                UserPrincipal principal = (UserPrincipal) userDetails;
                if (principal.isFirstLogin()) {
                    String requestURI = request.getRequestURI();
                    // Các endpoint cho phép khi chưa đổi mật khẩu (Dùng endsWith để tránh bị lỗi do dính prefix context-path như /api/v1)
                    boolean isAllowed = requestURI.endsWith("/auth/change-password") ||
                            requestURI.endsWith("/auth/logout") ||
                            requestURI.endsWith("/auth/me") ||
                            requestURI.endsWith("/auth/refresh");

                    if (!isAllowed) {
                        // Trả về 403 Forbidden nếu cố gắng gọi các API khác
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write(
                                "{\"success\": false, \"message\": \"Bạn phải đổi mật khẩu trong lần đăng nhập đầu tiên.\"}");
                        response.getWriter().flush();
                        return;
                    }
                }
            }

        } catch (Exception ex) {
            log.warn(
                    "JWT authentication failed for {} {}: {}",
                    request.getMethod(),
                    request.getRequestURI(),
                    ex.getMessage(),
                    ex);
            // token sai -> để chain đi tiếp, endpoint private sẽ bị chặn ở tầng security
        }

        filterChain.doFilter(request, response);
    }

    private String resolveAccessToken(HttpServletRequest request) {
        String cookieToken = CookieUtil.getCookieValue(request, accessTokenCookieName);
        if (cookieToken != null && !cookieToken.isBlank()) {
            return cookieToken;
        }

        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }

        String bearerToken = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        return bearerToken.isEmpty() ? null : bearerToken;
    }
}
