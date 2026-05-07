package vn.acme.paperless_meeting.service.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import vn.acme.paperless_meeting.entity.RefreshToken;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.repository.RefreshTokenRepository;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtTokenVerifier jwtTokenVerifier;

    @Value("${app.security.refresh-token-expiration-seconds}")
    private long refreshTokenExpirationSeconds;

    // Hàm này sẽ được gọi khi tạo refresh token mới sau khi người dùng đăng nhập
    // thành công hoặc khi refresh token cũ được sử dụng để lấy
    // access token mới.
    public void saveNewToken(String username, String rawToken, HttpServletRequest request) {
        User user = userRepository.findByUsernameAndStatus(username, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        RefreshToken token = RefreshToken.builder()
                .userId(user.getId())
                .jti(jwtTokenVerifier.extractJti(rawToken))
                .tokenHash(hashToken(rawToken))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpirationSeconds))
                .lastUsedAt(Instant.now())
                .build();

        refreshTokenRepository.save(token);
    }

    /**
     * Kiểm tra token hợp lệ, chưa bị thu hồi, chưa hết hạn và khớp với hash trong
     * database.
     * Trả về Optional<RefreshToken> để controller có thể dễ dàng xử lý trường hợp
     * token không hợp lệ.
     **/
    public Optional<RefreshToken> validate(String rawToken) {
        String jti = jwtTokenVerifier.extractJti(rawToken);

        return refreshTokenRepository.findByJti(jti)
                .filter(rt -> !rt.isRevoked())
                .filter(rt -> rt.getExpiresAt().isAfter(Instant.now()))
                .filter(rt -> MessageDigest.isEqual(
                        hashToken(rawToken).getBytes(StandardCharsets.UTF_8),
                        rt.getTokenHash().getBytes(StandardCharsets.UTF_8)));
    }

    /**
     * hàm này sẽ được gọi khi client gửi refresh token mới để đổi lấy access token
     * mới.
     * Nó sẽ thu hồi refresh token cũ bằng cách set revokedAt và replacedByJti, đồng
     * thời cập nhật lastUsedAt.
     * Việc này giúp đảm bảo rằng mỗi refresh token chỉ có thể được sử dụng một lần
     * để tạo access token mới, tăng cường bảo mật cho hệ thống.
     **/
    public void rotate(RefreshToken current, String newRawToken) {
        current.setRevokedAt(Instant.now());
        current.setReplacedByJti(jwtTokenVerifier.extractJti(newRawToken));
        current.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(current);
    }

    /**
     * Hàm này sẽ được gọi khi người dùng đăng xuất hoặc khi phát hiện refresh token
     * bị lạm dụng.
     * Nó sẽ thu hồi refresh token bằng cách set revokedAt, giúp ngăn chặn việc sử
     * dụng lại token đó trong tương lai.
     **/
    public void revokeByRawToken(String rawToken) {
        String jti = jwtTokenVerifier.extractJti(rawToken);
        refreshTokenRepository.findByJti(jti).ifPresent(rt -> {
            rt.setRevokedAt(Instant.now());
            rt.setLastUsedAt(Instant.now());
            refreshTokenRepository.save(rt);
        });
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashedBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is not available", e);
        }
    }

}
