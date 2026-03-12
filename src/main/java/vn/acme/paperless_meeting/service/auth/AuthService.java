package vn.acme.paperless_meeting.service.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.dto.request.LoginRequest;
import vn.acme.paperless_meeting.entity.RefreshToken;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenGenerator jwtTokenGenerator;
    private final JwtTokenVerifier jwtTokenVerifier;
    private final AuthCookieService authCookieService;
    private final RefreshTokenService refreshTokenService;
 

    public void login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPasswordHash()));

        String accessToken = jwtTokenGenerator.generateAccessToken(request.getUsername());
        String refreshToken = jwtTokenGenerator.generateRefreshToken(request.getUsername());

        refreshTokenService.saveNewToken(request.getUsername(), refreshToken, httpRequest);

        authCookieService.addAccessTokenCookie(response, accessToken);
        authCookieService.addRefreshTokenCookie(response, refreshToken);
    }

    public void refresh(String refreshToken, HttpServletRequest request, HttpServletResponse response) {
        if (refreshToken == null || !jwtTokenVerifier.isRefreshToken(refreshToken)) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        RefreshToken stored = refreshTokenService.validate(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.TOKEN_EXPIRED));

        String username = jwtTokenVerifier.extractUsername(refreshToken);

        String newAccessToken = jwtTokenGenerator.generateAccessToken(username);
        String newRefreshToken = jwtTokenGenerator.generateRefreshToken(username);

        refreshTokenService.rotate(stored, newRefreshToken);
        refreshTokenService.saveNewToken(username, newRefreshToken, request);

        authCookieService.addAccessTokenCookie(response, newAccessToken);
        authCookieService.addRefreshTokenCookie(response, newRefreshToken);
    }

    public void logout(String refreshToken, HttpServletResponse response) {
        if (refreshToken != null) {
            try {
                refreshTokenService.revokeByRawToken(refreshToken);
            } catch (Exception ignored) {
            }
        }

        authCookieService.clearAccessTokenCookie(response);
        authCookieService.clearRefreshTokenCookie(response);
    }

    // public void changePassword(Authentication authentication,
    // ChangePasswordRequest request) {
    // String username = authentication.getName();
    // User user =
    // userRepository.findByUsernameAndStatus(username,UserStatus.ACTIVE).orElseThrow(()->
    // new AppException(ErrorCode.USER_NOT_EXISTED));

    // if (!passwordEncoder.matches(request.currentPassword(),
    // user.getPasswordHash())) {
    // throw new BadCredentialsException("Mật khẩu hiện tại không đúng");
    // }

    // user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    // userRepository.save(user);
    // }
}