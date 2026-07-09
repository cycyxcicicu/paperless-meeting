package vn.acme.paperless_meeting.service.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.dto.request.auth.LoginRequest;
import vn.acme.paperless_meeting.entity.RefreshToken;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import vn.acme.paperless_meeting.dto.request.auth.ChangePasswordRequest;
import vn.acme.paperless_meeting.event.audit.AuditLogPublisher;
import vn.acme.paperless_meeting.entity.enums.AuditAction;
import vn.acme.paperless_meeting.entity.enums.ResourceType;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenGenerator jwtTokenGenerator;
    private final JwtTokenVerifier jwtTokenVerifier;
    private final AuthCookieService authCookieService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogPublisher auditLogPublisher;

    public void login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            // User → Role là N-1, chỉ cần load role để đưa vào JWT
            User user = userRepository.findWithRoleByUsernameAndStatus(request.getUsername(), UserStatus.ACTIVE)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

            // JWT chỉ chứa 1 role (String), permissions sẽ được load khi xác thực
            String role = user.getRole() != null ? "ROLE_" + user.getRole().getRoleCode() : null;

            String accessToken = jwtTokenGenerator.generateAccessToken(request.getUsername(), role);
            String refreshToken = jwtTokenGenerator.generateRefreshToken(request.getUsername());

            refreshTokenService.saveNewToken(request.getUsername(), refreshToken, httpRequest);

            authCookieService.addAccessTokenCookie(response, accessToken);
            authCookieService.addRefreshTokenCookie(response, refreshToken);

            String ip = httpRequest.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = httpRequest.getRemoteAddr();
            }
            auditLogPublisher.publish(
                    user,
                    AuditAction.LOGIN,
                    ResourceType.USER,
                    user.getId(),
                    Map.of("username", user.getUsername(), "ip", ip)
            );
        } catch (AppException ae) {
            if (ae.getErrorCode() == ErrorCode.USER_NOT_EXISTED) {
                throw new BadCredentialsException("Bad credentials");
            }
            throw ae;
        } catch (AuthenticationException ex) {
            throw ex;
        }
    }

    public void refresh(String refreshToken, HttpServletRequest request, HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        final String username;
        try {
            if (!jwtTokenVerifier.isRefreshToken(refreshToken)) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }
            username = jwtTokenVerifier.extractUsername(refreshToken);
        } catch (ExpiredJwtException ex) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        RefreshToken stored = refreshTokenService.validate(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.TOKEN_EXPIRED));

        // User → Role là N-1, chỉ cần load role để đưa vào JWT
        User user = userRepository.findWithRoleByUsernameAndStatus(username, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String role = user.getRole() != null ? "ROLE_" + user.getRole().getRoleCode() : null;

        String newAccessToken = jwtTokenGenerator.generateAccessToken(username, role);
        String newRefreshToken = jwtTokenGenerator.generateRefreshToken(username);

        refreshTokenService.rotate(stored, newRefreshToken);
        refreshTokenService.saveNewToken(username, newRefreshToken, request);

        authCookieService.addAccessTokenCookie(response, newAccessToken);
        authCookieService.addRefreshTokenCookie(response, newRefreshToken);
    }

    public void logout(String refreshToken, HttpServletResponse response) {
        if (refreshToken != null) {
            try {
                String username = jwtTokenVerifier.extractUsername(refreshToken);
                userRepository.findByUsername(username).ifPresent(user -> {
                    auditLogPublisher.publish(
                            user,
                            AuditAction.LOGOUT,
                            ResourceType.USER,
                            user.getId(),
                            Map.of("username", user.getUsername())
                    );
                });
            } catch (Exception ignored) {
            }
            try {
                refreshTokenService.revokeByRawToken(refreshToken);
            } catch (Exception ignored) {
                // Bất cứ lỗi gì khi revoke token cũng không ảnh hưởng đến việc logout, vì mục
                // đích chính của logout là xóa cookie phía client.
            }
        }

        authCookieService.clearAccessTokenCookie(response);
        authCookieService.clearRefreshTokenCookie(response);
    }

   

    public void changePassword(Authentication authentication, ChangePasswordRequest request) {
        String username = authentication.getName();
        User user = userRepository.findWithRoleByUsernameAndStatus(username, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadCredentialsException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setIsFirstLogin(false); // Đã đổi mật khẩu
        userRepository.save(user);

        auditLogPublisher.publish(
                user,
                AuditAction.CHANGE_PASSWORD,
                ResourceType.USER,
                user.getId(),
                Map.of("username", user.getUsername())
        );
    }




}
